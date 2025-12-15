const { Task, IntervalStatus } = require('../models/Task');
const TaskEvidence = require('../models/TaskEvidence');

const EvidenceStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

class TaskManagementDaily {
  constructor() {
    this.logger = {
      log: (message) => console.log(`[TaskManagementDaily] ${message}`),
      warn: (message) => console.warn(`[TaskManagementDaily] ${message}`),
      error: (message, error) => console.error(`[TaskManagementDaily] ${message}`, error)
    };
  }

  async addDailyTask() {
    try {
      this.logger.log('Starting daily task creation process...');

      const currentDate = new Date();
      const startOfDay = new Date(currentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);

      const startOfDayTime = startOfDay.getTime();
      const endOfDayTime = endOfDay.getTime();

      // Find all active daily tasks
      const dailyTasks = await Task.find({
        taskFrequency: 'daily',
        status: 'active',
        startDateTime: { $lte: endOfDayTime },
        $or: [
          { endDateTime: { $gte: startOfDayTime } },
          { endDateTime: null }
        ]
      });

      this.logger.log(`Found ${dailyTasks.length} active daily tasks to process`);

      if (dailyTasks.length === 0) {
        this.logger.warn('No active daily tasks found in database');
        return {
          success: true,
          message: 'No daily tasks to process',
          processedCount: 0,
          createdCount: 0,
          skippedCount: 0,
          details: []
        };
      }

      const results = [];

      for (const task of dailyTasks) {
        try {
          const result = await this.createDailyTaskEvidence(task, startOfDay, endOfDay);
          if (result) {
            results.push(result);
          }
        } catch (error) {
          this.logger.error(
            `Failed to create evidence for task ${task.taskName}:`,
            error
          );
          results.push({
            taskId: task._id,
            taskName: task.taskName,
            action: 'failed',
            error: error.message
          });
        }
      }

      const createdCount = results.filter(r => r.action === 'created').length;
      const skippedCount = results.filter(r => r.action === 'skipped').length;

      this.logger.log(
        `Daily task processing complete. Created: ${createdCount}, Skipped: ${skippedCount}`
      );

      return {
        success: true,
        processedCount: dailyTasks.length,
        createdCount: createdCount,
        skippedCount: skippedCount,
        details: results
      };
    } catch (error) {
      this.logger.error('Error in addDailyTask:', error);
      throw error;
    }
  }

  async createDailyTaskEvidence(task, startOfDay, endOfDay) {
    try {
      const startOfDayTime = startOfDay.getTime();
      const endOfDayTime = endOfDay.getTime();

      this.logger.log(`\n🔄 Processing Daily Task: ${task.taskName} (ID: ${task._id})`);

      // Check if evidence already exists for today
      const existingEvidence = await this.hasEvidenceForToday(
        String(task._id),
        startOfDay
      );

      if (existingEvidence) {
        this.logger.log(`   ❌ SKIPPING: Evidence already exists for today`);
        return {
          taskId: task._id,
          taskName: task.taskName,
          action: 'skipped',
          reason: 'Evidence already exists for today',
          date: startOfDay.toDateString()
        };
      }

      // Check if task has assigned users
      if (!task.assignedTo || task.assignedTo.length === 0) {
        this.logger.log(`   ❌ SKIPPING: No users assigned to task`);
        return {
          taskId: task._id,
          taskName: task.taskName,
          action: 'skipped',
          reason: 'No users assigned to task',
          date: startOfDay.toDateString()
        };
      }

      this.logger.log(`   ✅ Task validation passed, creating evidence...`);

      // Create task intervals for today
      const updatedIntervals = (task.taskIntervals || []).map((intervals) => {
        const startDateAndTime = new Date(intervals.start);
        const endDateAndTime = new Date(intervals.end);

        // Set the date to today but keep the time
        startDateAndTime.setDate(startOfDay.getDate());
        startDateAndTime.setMonth(startOfDay.getMonth());
        startDateAndTime.setFullYear(startOfDay.getFullYear());

        endDateAndTime.setDate(startOfDay.getDate());
        endDateAndTime.setMonth(startOfDay.getMonth());
        endDateAndTime.setFullYear(startOfDay.getFullYear());

        return {
          start: startDateAndTime.getTime(),
          end: endDateAndTime.getTime(),
          status: 'pending',
          taskEvidenceUrl: '',
          interval: intervals.interval || 'daily',
          remarks: 'pending'
        };
      });

      // If no intervals defined, create a default one for the whole day
      if (updatedIntervals.length === 0) {
        updatedIntervals.push({
          start: startOfDayTime,
          end: endOfDayTime,
          status: 'pending',
          taskEvidenceUrl: '',
          interval: 'daily',
          remarks: 'pending'
        });
      }

      const createdEvidences = [];

      // Check isCommon flag to determine evidence creation strategy
      if (task.isCommon === false) {
        // Create separate task evidence for each assigned user
        this.logger.log(
          `   Task ${task.taskName} is NOT common - creating separate evidence for ${task.assignedTo.length} users`
        );

        for (const userId of task.assignedTo) {
          // Double check for user-specific evidence
          const userEvidenceExists = await this.hasEvidenceForTodayAndUser(
            String(task._id),
            startOfDay,
            String(userId)
          );

          if (userEvidenceExists) {
            this.logger.log(`      ⏭️  Evidence already exists for user ${userId}`);
            continue;
          }

          const evidenceData = {
            taskId: task._id,
            taskName: task.taskName,
            description: task.description || '',
            priority: task.priority,
            taskFrequency: task.taskFrequency,
            scheduleType: task.scheduleType,
            scheduledDateTime: task.scheduledDateTime,
            startDateTime: task.startDateTime,
            endDateTime: task.endDateTime,
            weekDays: task.weekDays || [],
            weekDaysForMonthly: task.weekDaysForMonthly || [],
            monthWeeks: task.monthWeeks || [],
            roleId: task.roleId,
            unitIds: task.unitIds,
            assignedTo: [userId], // Single user for individual evidence
            taskIntervals: updatedIntervals,
            status: EvidenceStatus.PENDING,
            createdAt: startOfDayTime,
            updatedAt: startOfDayTime,
          };

          const createEvidence = new TaskEvidence(evidenceData);
          const savedEvidence = await createEvidence.save();
          createdEvidences.push(savedEvidence);

          this.logger.log(`      ✅ Created individual evidence for user ${userId} - ID: ${savedEvidence._id}`);
        }
      } else {
        // Create single task evidence for all users (isCommon = true or undefined)
        this.logger.log(
          `   Task ${task.taskName} is common - creating single evidence for all ${task.assignedTo.length} users`
        );

        const evidenceData = {
          taskId: task._id,
          taskName: task.taskName,
          description: task.description || '',
          priority: task.priority,
          taskFrequency: task.taskFrequency,
          scheduleType: task.scheduleType,
          scheduledDateTime: task.scheduledDateTime,
          startDateTime: task.startDateTime,
          endDateTime: task.endDateTime,
          weekDays: task.weekDays || [],
          weekDaysForMonthly: task.weekDaysForMonthly || [],
          monthWeeks: task.monthWeeks || [],
          roleId: task.roleId,
          unitIds: task.unitIds,
          assignedTo: task.assignedTo, // All users for common evidence
          taskIntervals: updatedIntervals,
          status: EvidenceStatus.PENDING,
          createdAt: startOfDayTime,
          updatedAt: startOfDayTime,
        };

        const createEvidence = new TaskEvidence(evidenceData);
        const savedEvidence = await createEvidence.save();
        createdEvidences.push(savedEvidence);

        this.logger.log(`      ✅ Created common evidence - ID: ${savedEvidence._id}`);
      }

      if (createdEvidences.length > 0) {
        this.logger.log(`\n   ✅ Successfully created ${createdEvidences.length} task evidence(s) for ${task.taskName}`);

        return {
          taskId: task._id,
          taskName: task.taskName,
          action: 'created',
          evidenceCount: createdEvidences.length,
          evidenceIds: createdEvidences.map(e => e._id),
          date: startOfDay.toDateString()
        };
      } else {
        return {
          taskId: task._id,
          taskName: task.taskName,
          action: 'skipped',
          reason: 'No evidence created (all users already have evidence)',
          date: startOfDay.toDateString()
        };
      }
    } catch (error) {
      this.logger.error(
        `Error creating daily evidence for ${task.taskName}:`,
        error
      );
      throw error;
    }
  }

  // Check if evidence exists for today for this task
  async hasEvidenceForToday(taskId, startOfDay) {
    try {
      const startOfDayTime = new Date(startOfDay);
      startOfDayTime.setHours(0, 0, 0, 0);

      const endOfDayTime = new Date(startOfDay);
      endOfDayTime.setHours(23, 59, 59, 999);

      const evidence = await TaskEvidence.findOne({
        taskId: taskId,
        createdAt: {
          $gte: startOfDayTime.getTime(),
          $lte: endOfDayTime.getTime(),
        },
      });

      return evidence !== null;
    } catch (error) {
      this.logger.error('Error checking evidence for today:', error);
      return false;
    }
  }

  // Check if evidence exists for today for this task and specific user
  async hasEvidenceForTodayAndUser(taskId, startOfDay, userId) {
    try {
      const startOfDayTime = new Date(startOfDay);
      startOfDayTime.setHours(0, 0, 0, 0);

      const endOfDayTime = new Date(startOfDay);
      endOfDayTime.setHours(23, 59, 59, 999);

      const evidence = await TaskEvidence.findOne({
        taskId: taskId,
        assignedTo: userId,
        createdAt: {
          $gte: startOfDayTime.getTime(),
          $lte: endOfDayTime.getTime(),
        },
      });

      return evidence !== null;
    } catch (error) {
      this.logger.error('Error checking evidence for today and user:', error);
      return false;
    }
  }
}

module.exports = new TaskManagementDaily();
