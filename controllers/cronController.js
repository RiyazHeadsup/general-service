const { Task, IntervalStatus } = require('../models/Task');
const TaskEvidence = require('../models/TaskEvidence');

const EvidenceStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

class CronController {

  async triggerDailyTask(req, res) {
    console.log("hello Shariq", req.body);

    try {
      const result = await this.createDailyTaskEvidence();
      res.status(200).json({
        result,
        success: true,
        message: 'Daily task evidence creation triggered successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to trigger daily task evidence creation',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async triggerMonthlyTask(req, res) {
    console.log("hello Shariq", req.body);
    console.log('🔔 Trigger monthly task endpoint hit');
    try {
      console.log('🔄 Calling addMonthlyTask...');
      const result = await this.addMonthlyTask();
      console.log('✅ addMonthlyTask completed');

      res.status(200).json({
        result,
        success: true,
        message: 'Monthly task evidence creation triggered successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Error in triggerMonthlyTask:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger monthly task evidence creation',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async debugMonthlyTasks(req, res) {
    try {
      // Get all tasks to debug
      const allTasks = await Task.find({});
      const monthlyTasks = await Task.find({
        status: 'active',
        taskFrequency: 'monthly'
      });

      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Check which tasks have evidence for this month
      const tasksWithDetails = await Promise.all(
        monthlyTasks.map(async (task) => {
          const hasEvidence = task.taskcreatedformonth ?
            new Date(task.taskcreatedformonth).getMonth() === currentMonth &&
            new Date(task.taskcreatedformonth).getFullYear() === currentYear : false;

          // Calculate what dates would be created
          const weekDaysForMonthly = (task.weekDaysForMonthly || []).map(String);
          const monthWeeks = (task.monthWeeks || []).map(String);

          let calculatedDates = [];
          let skipReason = null;

          if (hasEvidence) {
            skipReason = 'Already created for current month';
          } else if (!weekDaysForMonthly.length || !monthWeeks.length) {
            skipReason = 'Missing weekDaysForMonthly or monthWeeks';
          } else if (!task.assignedTo || task.assignedTo.length === 0) {
            skipReason = 'No users assigned';
          } else {
            // Calculate dates
            try {
              const weekdayOccurrences = this.calculateWeekdayOccurrencesInMonth(
                weekDaysForMonthly,
                monthWeeks,
                today
              );

              const todayStart = new Date(today);
              todayStart.setHours(0, 0, 0, 0);

              for (const [dayStr, dates] of Object.entries(weekdayOccurrences)) {
                for (const date of dates) {
                  if (date >= todayStart) {
                    calculatedDates.push(date.toISOString());
                  }
                }
              }

              if (calculatedDates.length === 0) {
                skipReason = 'All calculated dates are in the past';
              }
            } catch (err) {
              skipReason = `Error calculating dates: ${err.message}`;
            }
          }

          return {
            _id: task._id,
            taskName: task.taskName,
            status: task.status,
            taskFrequency: task.taskFrequency,
            weekDaysForMonthly: task.weekDaysForMonthly,
            monthWeeks: task.monthWeeks,
            assignedTo: task.assignedTo,
            assignedToCount: task.assignedTo?.length || 0,
            isCommon: task.isCommon,
            taskcreatedformonth: task.taskcreatedformonth,
            hasEvidenceForCurrentMonth: hasEvidence,
            hasRequiredFields: !!(task.weekDaysForMonthly?.length && task.monthWeeks?.length),
            calculatedDates: calculatedDates,
            willCreateEvidence: calculatedDates.length > 0 && !hasEvidence,
            skipReason: skipReason
          };
        })
      );

      res.status(200).json({
        success: true,
        currentDate: today.toISOString(),
        currentMonth: currentMonth + 1,
        currentYear: currentYear,
        totalTasks: allTasks.length,
        totalMonthlyTasks: monthlyTasks.length,
        activeMonthlyTasks: monthlyTasks.filter(t => t.status === 'active').length,
        tasksDetails: tasksWithDetails,
        summary: {
          tasksReadyToCreate: tasksWithDetails.filter(t => t.willCreateEvidence).length,
          tasksAlreadyCreated: tasksWithDetails.filter(t => t.hasEvidenceForCurrentMonth).length,
          tasksMissingFields: tasksWithDetails.filter(t => !t.hasRequiredFields).length,
          tasksWithPastDates: tasksWithDetails.filter(t => t.skipReason === 'All calculated dates are in the past').length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Debug failed',
        error: error.message,
        stack: error.stack
      });
    }
  }

  getStatus(req, res) {
    res.status(200).json({
      service: 'Cron Service',
      status: 'active',
      endpoints: {
        triggerDailyTask: 'POST /generalservice/trigger-daily-task',
        triggerMonthlyTask: 'POST /generalservice/trigger-monthly-task',
        debugMonthlyTasks: 'GET /generalservice/debug-monthly-tasks',
        status: 'GET /generalservice/cron-status',
      },
      timestamp: new Date().toISOString(),
    });
  }

  async createDailyTaskEvidence() {
    const currentDate = new Date();
    const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0)).getTime();
    const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999)).getTime();

    const dailyTasks = await Task.find({
      taskFrequency: 'daily',
      status: 'active',
      startDateTime: { $lte: endOfDay },
      $or: [
        { endDateTime: { $gte: startOfDay } },
        { endDateTime: null }
      ]
    });

    const results = [];

    for (const task of dailyTasks) {
      const existingInterval = task.taskIntervals.find(
        interval => interval.start >= startOfDay && interval.start <= endOfDay
      );

      if (!existingInterval) {
        task.taskIntervals.push({
          start: startOfDay,
          end: endOfDay,
          status: IntervalStatus.PENDING,
          interval: 'daily',
          taskEvidenceUrl: null
        });

        await task.save();
        results.push({
          taskId: task._id,
          taskName: task.taskName,
          action: 'created',
          interval: { start: startOfDay, end: endOfDay }
        });
      } else {
        results.push({
          taskId: task._id,
          taskName: task.taskName,
          action: 'skipped',
          reason: 'Interval already exists for today'
        });
      }
    }

    return {
      processedCount: dailyTasks.length,
      createdCount: results.filter(r => r.action === 'created').length,
      skippedCount: results.filter(r => r.action === 'skipped').length,
      details: results
    };
  }

  // ==========================================
  // NEW MONTHLY TASK LOGIC implementation
  // ==========================================

  async addMonthlyTask() {
    try {
      console.log('📅 Starting monthly task creation process...');

      // Modified to fetch all active monthly tasks
      const monthlyTasks = await Task.find({
        status: 'active',
        taskFrequency: 'monthly'
      });
      console.log(`Found ${monthlyTasks.length} monthly tasks to process`);

      // Log each task details for debugging
      monthlyTasks.forEach((task, index) => {
        console.log(`\n=== Task ${index + 1}: ${task.taskName} ===`);
        console.log(`  _id: ${task._id}`);
        console.log(`  weekDaysForMonthly: ${JSON.stringify(task.weekDaysForMonthly)}`);
        console.log(`  monthWeeks: ${JSON.stringify(task.monthWeeks)}`);
        console.log(`  assignedTo: ${task.assignedTo?.length || 0} users`);
        console.log(`  taskcreatedformonth: ${task.taskcreatedformonth ? new Date(task.taskcreatedformonth).toISOString() : 'null'}`);
      });

      if (monthlyTasks.length === 0) {
        console.warn('⚠️ No monthly tasks found in database');
        return {
          success: true,
          message: 'No monthly tasks to process',
          createdEvidences: [],
        };
      }

      const createdEvidences = await Promise.all(
        monthlyTasks.map(async (element) => {
          try {
            return await this.createMonthlyTask(element);
          } catch (error) {
            console.error(
              `Failed to create evidence for task ${element.taskName}:`,
              error,
            );
            return null;
          }
        }),
      );

      const successfulCreations = createdEvidences
        .filter((evidence) => evidence !== null)
        .flat();
      console.log(
        `✅ Successfully created ${successfulCreations.length} monthly task evidences`,
      );

      // summary logic ...
      const today = new Date();
      const currentDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();

      const tasksSummary = monthlyTasks.map((task) => {
        return {
          taskName: task.taskName,
          weekDays: task.weekDaysForMonthly,
          monthWeeks: task.monthWeeks
        };
      });

      return {
        success: true,
        totalTasks: monthlyTasks.length,
        successfulCreations: successfulCreations.length,
        createdEvidences: successfulCreations,
        tasksSummary
      };
    } catch (error) {
      console.error('Error in addMonthlyTask:', error);
      throw error;
    }
  }

  async createMonthlyTask(element) {
    try {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      console.log(`\n🔄 Processing Task: ${element.taskName} (ID: ${element._id})`);
      console.log(`   Current Date: ${today.toISOString()}`);
      console.log(`   Current Month: ${currentMonth + 1}, Year: ${currentYear}`);

      // Check if already created for this month
      if (element.taskcreatedformonth) {
        const createdDate = new Date(element.taskcreatedformonth);
        const createdMonth = createdDate.getMonth();
        const createdYear = createdDate.getFullYear();

        console.log(`   taskcreatedformonth: ${createdDate.toISOString()}`);
        console.log(`   Created Month: ${createdMonth + 1}, Year: ${createdYear}`);

        if (createdMonth === currentMonth && createdYear === currentYear) {
          console.log(`   ❌ SKIPPING: Already created for this month`);
          return null;
        }
      }

      // Calculate weekday occurrences based on monthWeeks and weekDaysForMonthly
      // Ensure we convert number arrays to string arrays if needed, or update logic to handle numbers
      const weekDaysForMonthly = (element.weekDaysForMonthly || []).map(String);
      const monthWeeks = (element.monthWeeks || []).map(String);

      console.log(`   Task Config - WeekDays: [${weekDaysForMonthly.join(',')}], Weeks: [${monthWeeks.join(',')}]`);

      if (weekDaysForMonthly.length === 0 || monthWeeks.length === 0) {
        console.log(`   ❌ SKIPPING: Missing configuration (weekDaysForMonthly or monthWeeks empty)`);
        return null;
      }

      if (!element.assignedTo || element.assignedTo.length === 0) {
        console.log(`   ❌ SKIPPING: No users assigned to task`);
        return null;
      }

      console.log(`   ✅ Task validation passed, proceeding to calculate occurrences...`);

      const weekdayOccurrences = this.calculateWeekdayOccurrencesInMonth(
        weekDaysForMonthly,
        monthWeeks,
        today,
      );

      // Create evidence for all weekday occurrences in the month
      const createdEvidences = [];
      const occurrencesCount = Object.values(weekdayOccurrences).reduce((acc, val) => acc + val.length, 0);
      console.log(`   📊 Calculated ${occurrencesCount} potential occurrences for ${element.taskName}`);

      if (occurrencesCount === 0) {
        console.log(`   ❌ SKIPPING: No valid date occurrences calculated`);
        return null;
      }

      // Log all calculated dates
      for (const [dayStr, dates] of Object.entries(weekdayOccurrences)) {
        console.log(`   Day ${dayStr}: ${dates.length} dates - ${dates.map(d => d.toDateString()).join(', ')}`);
      }

      for (const [dayStr, dates] of Object.entries(weekdayOccurrences)) {
        const dayNum = parseInt(dayStr);

        for (const targetDate of dates) {
          // Skip if date is in the past (but include today)
          const todayStart = new Date(today);
          todayStart.setHours(0, 0, 0, 0);

          if (targetDate < todayStart) {
            console.log(`   ⏭️  Skipping past date: ${targetDate.toDateString()}`);
            continue;
          }

          console.log(`\n   ✔️  Checking date: ${targetDate.toDateString()} for ${element.taskName}`);

          // Check if evidence already exists for this date
          if (element.isCommon !== false) {
            console.log(`      Checking if evidence exists for this date...`);
            const existingEvidence = await this.hasEvidenceForDate(
              String(element._id),
              targetDate,
            );

            if (existingEvidence) {
              console.log(`      ❌ SKIPPING: Common evidence already exists`);
              continue;
            } else {
              console.log(`      ✅ No existing evidence found, will create`);
            }
          }

          const updatedIntervals = (element.taskIntervals || []).map((intervals) => {
            const startDateAndTime = new Date(intervals.start);
            const endDateAndTime = new Date(intervals.end);

            startDateAndTime.setDate(targetDate.getDate());
            startDateAndTime.setMonth(targetDate.getMonth());
            startDateAndTime.setFullYear(targetDate.getFullYear());

            endDateAndTime.setDate(targetDate.getDate());
            endDateAndTime.setMonth(targetDate.getMonth());
            endDateAndTime.setFullYear(targetDate.getFullYear());

            return {
              start: startDateAndTime.getTime(),
              end: endDateAndTime.getTime(),
              status: 'pending',
              taskEvidenceUrl: '',
              interval: intervals.interval || '',
              remarks: "pending"
            };
          });

          const targetDateStart = new Date(targetDate);
          targetDateStart.setHours(0, 0, 0, 0);

          // Check isCommon flag to determine evidence creation strategy
          const assignedUsers = element.assignedTo || [];

          if (assignedUsers.length === 0) {
            console.log(`  Warning: No users assigned to task ${element.taskName}`);
          }

          if (element.isCommon === false) {
            // Create separate task evidence for each assigned user
            for (const userId of assignedUsers) {
              const userEvidenceExists = await this.hasEvidenceForDateAndUser(
                String(element._id),
                targetDate,
                String(userId),
              );

              if (userEvidenceExists) {
                continue;
              }

              const evidenceData = {
                taskId: element._id,
                taskName: element.taskName,
                description: element.description || '',
                priority: element.priority,
                taskFrequency: element.taskFrequency,
                scheduleType: element.scheduleType,
                scheduledDateTime: element.scheduledDateTime,
                startDateTime: element.startDateTime,
                endDateTime: element.endDateTime,
                weekDays: element.weekDays || [],
                weekDaysForMonthly: element.weekDaysForMonthly || [],
                monthWeeks: element.monthWeeks || [],
                roleId: element.roleId,
                unitIds: element.unitIds,
                assignedTo: [userId],
                taskIntervals: updatedIntervals,
                status: EvidenceStatus.PENDING,
                createdAt: targetDateStart.getTime(),
                updatedAt: targetDateStart.getTime(),
              };

              const createEvidence = new TaskEvidence(evidenceData);
              const savedEvidence = await createEvidence.save();
              createdEvidences.push(savedEvidence);
              console.log(`      ✅ Created individual evidence for user ${userId} - ID: ${savedEvidence._id}`);
            }
          } else {
            // Create single task evidence for all users
            const evidenceData = {
              taskId: element._id,
              taskName: element.taskName,
              description: element.description || '',
              priority: element.priority,
              taskFrequency: element.taskFrequency,
              scheduleType: element.scheduleType,
              scheduledDateTime: element.scheduledDateTime,
              startDateTime: element.startDateTime,
              endDateTime: element.endDateTime,
              weekDays: element.weekDays || [],
              weekDaysForMonthly: element.weekDaysForMonthly || [],
              monthWeeks: element.monthWeeks || [],
              roleId: element.roleId,
              unitIds: element.unitIds,
              assignedTo: assignedUsers,
              taskIntervals: updatedIntervals,
              status: EvidenceStatus.PENDING,
              createdAt: targetDateStart.getTime(),
              updatedAt: targetDateStart.getTime(),
            };

            const createEvidence = new TaskEvidence(evidenceData);
            const savedEvidence = await createEvidence.save();
            createdEvidences.push(savedEvidence);
            console.log(`      ✅ Created common evidence - ID: ${savedEvidence._id}`);
          }
        }
      }

      // Update the task's taskcreatedformonth field if evidence was created
      if (createdEvidences.length > 0) {
        console.log(`\n   ✅ Successfully created ${createdEvidences.length} task evidence(s)`);
        await Task.updateOne(
          { _id: element._id },
          { taskcreatedformonth: Date.now() },
        );
        console.log(`   ✅ Updated taskcreatedformonth for task: ${element.taskName}`);
      } else {
        console.log(`\n   ⚠️  No evidence created for task: ${element.taskName}`);
      }

      return createdEvidences.length > 0 ? createdEvidences : null;
    } catch (error) {
      console.error(
        `Error creating monthly evidence for ${element.taskName}:`,
        error,
      );
      throw error;
    }
  }

  getCurrentWeekOfMonth(date) {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const currentDate = date.getDate();
    const adjustedDate = currentDate + firstDayWeekday - 1;
    const weekOfMonth = Math.ceil(adjustedDate / 7);
    return weekOfMonth;
  }

  async getRemainingWeeks(monthWeeks, currentWeek, taskId) {
    console.log(
      `Month weeks scheduled: [${monthWeeks.join(', ')}], Current week: ${currentWeek}`,
    );

    const upcomingWeeks = monthWeeks.filter(
      (week) => parseInt(week) > currentWeek,
    );

    let currentWeekRemaining = false;
    if (monthWeeks.includes(currentWeek.toString()) && taskId) {
      currentWeekRemaining = await this.isCurrentWeekIncomplete(
        taskId,
        currentWeek,
      );
    }

    const remainingWeeks = [...upcomingWeeks];
    if (currentWeekRemaining) {
      remainingWeeks.unshift(currentWeek.toString());
    }

    const passedWeeks = monthWeeks.filter(
      (week) => parseInt(week) < currentWeek,
    );

    console.log(
      `Passed weeks: [${passedWeeks.join(', ')}], Current week incomplete: ${currentWeekRemaining}, Remaining weeks: [${remainingWeeks.join(', ')}]`,
    );

    return remainingWeeks;
  }

  async isCurrentWeekIncomplete(taskId, currentWeek) {
    try {
      const today = new Date();
      const startOfWeek = this.getStartOfWeek(today, currentWeek);
      const endOfWeek = this.getEndOfWeek(today, currentWeek);

      console.log(
        `Checking completion for week ${currentWeek}: ${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`,
      );

      const taskEvidence = await TaskEvidence.findOne({
        taskId: taskId,
        createdAt: {
          $gte: startOfWeek.getTime(),
          $lte: endOfWeek.getTime(),
        },
      });

      if (!taskEvidence) {
        console.log(`No evidence found for current week ${currentWeek}`);
        return true;
      }

      const incompleteIntervals = taskEvidence.taskIntervals.filter(
        (interval) =>
          interval.status === 'pending' || interval.status === 'missed',
      );

      const isIncomplete = incompleteIntervals.length > 0;
      console.log(
        `Week ${currentWeek} task status: ${taskEvidence.status}, Incomplete intervals: ${incompleteIntervals.length}`,
      );

      return isIncomplete;
    } catch (error) {
      console.error(`Error checking week completion:`, error);
      return true;
    }
  }

  getStartOfWeek(date, weekNumber) {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const startDate = 1 + (weekNumber - 1) * 7 - firstDayWeekday + 1;
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      Math.max(1, startDate),
    );
  }

  getEndOfWeek(date, weekNumber) {
    const startOfWeek = this.getStartOfWeek(date, weekNumber);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
  }

  async getRemainingWeekdaysForCurrentWeek(weekDaysForMonthly, currentWeek, today, taskId) {
    try {
      const currentDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();

      console.log(
        `Checking weekdays: Scheduled [${weekDaysForMonthly.join(', ')}], Today is day ${currentDayOfWeek} (${this.getDayName(currentDayOfWeek)})`,
      );

      const remainingWeekdays = [];

      for (const dayStr of weekDaysForMonthly) {
        const dayNum = parseInt(dayStr);
        const todayWeek = this.getCurrentWeekOfMonth(today);
        if (currentWeek === todayWeek && dayNum < currentDayOfWeek) {
          console.log(
            `Day ${dayNum} (${this.getDayName(dayNum)}) - passed in current week ${currentWeek}`,
          );
          continue;
        }

        const evidenceExists = await this.hasEvidenceForWeekday(
          taskId,
          currentWeek,
          dayNum,
          today,
        );

        if (!evidenceExists) {
          remainingWeekdays.push(dayStr);
          console.log(
            `Day ${dayNum} (${this.getDayName(dayNum)}) - remaining (no evidence)`,
          );
        } else {
          console.log(
            `Day ${dayNum} (${this.getDayName(dayNum)}) - completed (evidence exists)`,
          );
        }
      }

      return remainingWeekdays;
    } catch (error) {
      console.error('Error getting remaining weekdays:', error);
      return weekDaysForMonthly;
    }
  }

  async hasEvidenceForWeekday(taskId, weekNumber, dayOfWeek, currentDate) {
    try {
      const weekStartDate = this.getStartOfWeek(currentDate, weekNumber);
      const targetDate = new Date(weekStartDate);
      const weekStartDay =
        weekStartDate.getDay() === 0 ? 7 : weekStartDate.getDay();
      const daysToAdd = dayOfWeek - weekStartDay;
      targetDate.setDate(weekStartDate.getDate() + daysToAdd);

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const evidence = await TaskEvidence.findOne({
        taskId: taskId,
        createdAt: {
          $gte: startOfDay.getTime(),
          $lte: endOfDay.getTime(),
        },
      });

      return evidence !== null;
    } catch (error) {
      console.error('Error checking weekday evidence:', error);
      return false;
    }
  }

  getDateForWeekAndDay(currentDate, weekNumber, dayOfWeek) {
    const weekStartDate = this.getStartOfWeek(currentDate, weekNumber);
    const targetDate = new Date(weekStartDate);
    const weekStartDay =
      weekStartDate.getDay() === 0 ? 7 : weekStartDate.getDay();
    const daysToAdd = dayOfWeek - weekStartDay;
    targetDate.setDate(weekStartDate.getDate() + daysToAdd);
    return targetDate;
  }

  getLastWeekDatesForWeekday(currentDate, dayOfWeek) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dates = [];

    for (let day = daysInMonth; day >= 1; day--) {
      const date = new Date(year, month, day);
      const currentDayOfWeek = date.getDay() === 0 ? 7 : date.getDay();

      if (currentDayOfWeek === dayOfWeek) {
        const weekOfMonth = this.getCurrentWeekOfMonth(date);
        if (weekOfMonth === 5 || this.isDateInLastWeek(date)) {
          dates.push(date);
        }
      }
    }

    return dates.sort((a, b) => a.getTime() - b.getTime());
  }

  isDateInLastWeek(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const week4End = this.getEndOfWeek(date, 4);
    return date.getDate() > week4End.getDate() && date.getDate() <= daysInMonth;
  }

  async hasMonthlyEvidenceForCurrentMonth(taskId, currentDate) {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startOfMonth = new Date(year, month, 1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(year, month + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const evidence = await TaskEvidence.findOne({
        taskId: taskId,
        taskFrequency: 'monthly',
        createdAt: {
          $gte: startOfMonth.getTime(),
          $lte: endOfMonth.getTime(),
        },
      });

      return evidence !== null;
    } catch (error) {
      console.error(
        'Error checking monthly evidence for current month:',
        error,
      );
      return false;
    }
  }

  calculateWeekdayOccurrencesInMonth(weekDaysForMonthly, monthWeeks, currentDate = new Date()) {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const weekdayOccurrences = {};

      weekDaysForMonthly.forEach((day) => {
        weekdayOccurrences[day] = [];
      });

      monthWeeks.forEach((weekStr) => {
        const weekNumber = parseInt(weekStr);

        weekDaysForMonthly.forEach((dayStr) => {
          const dayNumber = parseInt(dayStr);

          if (weekNumber === 5) {
            const lastWeekDates = this.getLastWeekDatesForWeekday(currentDate, dayNumber);
            lastWeekDates.forEach(date => {
              weekdayOccurrences[dayStr].push(date);
            });
          } else {
            const targetDate = this.getDateForWeekAndDay(currentDate, weekNumber, dayNumber);
            if (targetDate.getMonth() === month && targetDate.getFullYear() === year) {
              weekdayOccurrences[dayStr].push(targetDate);
            }
          }
        });
      });

      return weekdayOccurrences;
    } catch (error) {
      console.error('Error calculating weekday occurrences:', error);
      return {};
    }
  }

  async hasEvidenceForDate(taskId, targetDate) {
    try {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const evidence = await TaskEvidence.findOne({
        taskId: taskId,
        createdAt: {
          $gte: startOfDay.getTime(),
          $lte: endOfDay.getTime(),
        },
      });

      return evidence !== null;
    } catch (error) {
      console.error('Error checking evidence for date:', error);
      return false;
    }
  }

  async hasEvidenceForDateAndUser(taskId, targetDate, userId) {
    try {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const evidence = await TaskEvidence.findOne({
        taskId: taskId,
        assignedTo: userId,
        createdAt: {
          $gte: startOfDay.getTime(),
          $lte: endOfDay.getTime(),
        },
      });

      return evidence !== null;
    } catch (error) {
      console.error('Error checking evidence for date and user:', error);
      return false;
    }
  }

  getWeekdayRepetitionSummary(weekDaysForMonthly, monthWeeks, currentDate = new Date()) {
    const weekDays = weekDaysForMonthly.map(String);
    const weeks = monthWeeks.map(String);

    const occurrences = this.calculateWeekdayOccurrencesInMonth(
      weekDays,
      weeks,
      currentDate,
    );

    const summary = Object.keys(occurrences).map((dayStr) => {
      const dayNumber = parseInt(dayStr);
      const dates = occurrences[dayStr].map((date) => date.toDateString());

      return {
        dayNumber: dayNumber,
        dayName: this.getDayName(dayNumber),
        repetitions: occurrences[dayStr].length,
        dates: dates.sort(),
      };
    });

    summary.sort((a, b) => a.dayNumber - b.dayNumber);

    const totalRepetitions = Object.values(occurrences).reduce(
      (sum, dateArray) => sum + dateArray.length,
      0,
    );

    return {
      totalWeekdays: weekDaysForMonthly.length,
      actualRepetitions: totalRepetitions,
      weekdayBreakdown: summary,
      monthYear: `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`,
    };
  }

  getDayName(dayNumber) {
    const days = [
      '',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return days[dayNumber] || 'Unknown';
  }
}

module.exports = new CronController();
