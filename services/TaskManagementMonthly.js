const { Task, IntervalStatus } = require('../models/Task');
const TaskEvidence = require('../models/TaskEvidence');

const EvidenceStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

class TaskManagementMonthly {
  constructor() {
    this.logger = {
      log: (message) => console.log(`[TaskManagementMonthly] ${message}`),
      warn: (message) => console.warn(`[TaskManagementMonthly] ${message}`),
      error: (message, error) => console.error(`[TaskManagementMonthly] ${message}`, error)
    };
  }

  async addMonthlyTask() {
    try {
      this.logger.log('Starting monthly task creation process...');

      const monthlyTasks = await Task.find({
        status: 'active',
        taskFrequency: 'monthly'
      });
      this.logger.log(`Found ${monthlyTasks.length} monthly tasks to process`);

      if (monthlyTasks.length === 0) {
        this.logger.warn('No monthly tasks found in database');
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
            this.logger.error(
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
      this.logger.log(
        `Successfully created ${successfulCreations.length} monthly task evidences`,
      );

      // Calculate weekday repetition summary for all tasks
      const today = new Date();
      const currentDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();

      const tasksSummary = monthlyTasks.map((task) => {
        // Calculate weekday repetitions for this task
        const weekdayRepetitionSummary = this.getWeekdayRepetitionSummary(
          task.weekDaysForMonthly,
          task.monthWeeks,
          today,
        );

        return {
          taskName: task.taskName,
          currentDayOfWeek: currentDayOfWeek,
          currentDayName: this.getDayName(currentDayOfWeek),
          scheduledWeekdays: task.weekDaysForMonthly,
          weekdayRepetitions: weekdayRepetitionSummary,
        };
      });

      return {
        success: true,
        totalTasks: monthlyTasks.length,
        successfulCreations: successfulCreations.length,
        failedCreations: monthlyTasks.length - successfulCreations.length,
        tasksSummary: tasksSummary,
        createdEvidences: successfulCreations,
      };
    } catch (error) {
      this.logger.error('Error in addMonthlyTask:', error);
      throw error;
    }
  }

  async createMonthlyTask(element) {
    try {
      const today = new Date();

      // Check if monthly task evidence already exists for current month using taskcreatedformonth
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      if (element.taskcreatedformonth) {
        const createdDate = new Date(element.taskcreatedformonth);
        if (
          createdDate.getMonth() === currentMonth &&
          createdDate.getFullYear() === currentYear
        ) {
          this.logger.log(
            `Monthly task evidence already exists for current month (${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}) for task: ${element.taskName}`,
          );
          return null;
        }
      }

      // Calculate weekday occurrences based on monthWeeks and weekDaysForMonthly
      const weekdayOccurrences = this.calculateWeekdayOccurrencesInMonth(
        element.weekDaysForMonthly,
        element.monthWeeks,
        today,
      );

      this.logger.log(
        `Scheduled weekdays: [${element.weekDaysForMonthly.join(', ')}]`,
      );

      // Create evidence for all weekday occurrences in the month
      const createdEvidences = [];

      for (const [dayStr, dates] of Object.entries(weekdayOccurrences)) {
        const dayNum = parseInt(dayStr);

        for (const targetDate of dates) {
          // Skip if date is in the past (but include today)
          const todayStart = new Date(today);
          todayStart.setHours(0, 0, 0, 0);

          if (targetDate < todayStart) {
            this.logger.log(
              `Skipping past date: ${targetDate.toDateString()} for ${this.getDayName(dayNum)}`,
            );
            continue;
          }

          // Log if we're including today
          if (targetDate.toDateString() === today.toDateString()) {
            this.logger.log(
              `Including current day: ${targetDate.toDateString()} for ${this.getDayName(dayNum)}`,
            );
          }

          // Check if evidence already exists for this date
          // For common tasks, check once. For individual tasks, check per user later
          if (element.isCommon !== false) {
            const existingEvidence = await this.hasEvidenceForDate(
              String(element._id),
              targetDate,
            );

            if (existingEvidence) {
              this.logger.log(
                `Common evidence already exists for ${element.taskName} on ${targetDate.toDateString()}`,
              );
              continue;
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

          // Set createdAt and updatedAt to the target date's start time
          const targetDateStart = new Date(targetDate);
          targetDateStart.setHours(0, 0, 0, 0);

          // Check isCommon flag to determine evidence creation strategy
          if (element.isCommon === false) {
            // Create separate task evidence for each assigned user
            this.logger.log(
              `Task ${element.taskName} is NOT common - creating separate evidence for ${element.assignedTo?.length || 0} users`,
            );

            const assignedUsers = element.assignedTo || [];
            for (const userId of assignedUsers) {
              // Check if evidence already exists for this specific user and date
              const userEvidenceExists = await this.hasEvidenceForDateAndUser(
                String(element._id),
                targetDate,
                String(userId),
              );

              if (userEvidenceExists) {
                this.logger.log(
                  `Individual evidence already exists for user ${userId} - Task: ${element.taskName} on ${targetDate.toDateString()}`,
                );
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
                assignedTo: [userId], // Single user for individual evidence
                taskIntervals: updatedIntervals,
                status: EvidenceStatus.PENDING,
                createdAt: targetDateStart.getTime(),
                updatedAt: targetDateStart.getTime(),
              };

              const createEvidence = new TaskEvidence(evidenceData);
              const savedEvidence = await createEvidence.save();
              createdEvidences.push(savedEvidence);

              this.logger.log(
                `Individual task evidence created for user ${userId} - Task: ${element.taskName} on ${targetDate.toDateString()} (${this.getDayName(dayNum)})`,
              );
            }
          } else {
            // Create single task evidence for all users (isCommon = true or undefined)
            this.logger.log(
              `Task ${element.taskName} is common - creating single evidence for all ${element.assignedTo?.length || 0} users`,
            );

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
              assignedTo: element.assignedTo || [], // All users for common evidence
              taskIntervals: updatedIntervals,
              status: EvidenceStatus.PENDING,
              createdAt: targetDateStart.getTime(),
              updatedAt: targetDateStart.getTime(),
            };

            const createEvidence = new TaskEvidence(evidenceData);
            const savedEvidence = await createEvidence.save();
            createdEvidences.push(savedEvidence);

            this.logger.log(
              `Common task evidence created for: ${element.taskName} on ${targetDate.toDateString()} (${this.getDayName(dayNum)}) assigned to ${element.assignedTo?.length || 0} users`,
            );
          }
        }
      }

      // Update the task's taskcreatedformonth field if evidence was created
      if (createdEvidences.length > 0) {
        await Task.updateOne(
          { _id: element._id },
          { taskcreatedformonth: Date.now() },
        );
        this.logger.log(
          `Updated taskcreatedformonth for task: ${element.taskName}`,
        );
      }

      return createdEvidences.length > 0 ? createdEvidences : null;
    } catch (error) {
      this.logger.error(
        `Error creating monthly evidence for ${element.taskName}:`,
        error,
      );
      throw error;
    }
  }

  // Helper function to get current week of the month (1-4 or 1-5)
  getCurrentWeekOfMonth(date) {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const currentDate = date.getDate();

    const adjustedDate = currentDate + firstDayWeekday - 1;
    const weekOfMonth = Math.ceil(adjustedDate / 7);

    return weekOfMonth;
  }

  // Helper function to get remaining weeks in the month
  async getRemainingWeeks(monthWeeks, currentWeek, taskId) {
    this.logger.log(
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

    this.logger.log(
      `Passed weeks: [${passedWeeks.join(', ')}], Current week incomplete: ${currentWeekRemaining}, Remaining weeks: [${remainingWeeks.join(', ')}]`,
    );

    return remainingWeeks;
  }

  // Check if current week's tasks are incomplete
  async isCurrentWeekIncomplete(taskId, currentWeek) {
    try {
      const today = new Date();
      const startOfWeek = this.getStartOfWeek(today, currentWeek);
      const endOfWeek = this.getEndOfWeek(today, currentWeek);

      this.logger.log(
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
        this.logger.log(`No evidence found for current week ${currentWeek}`);
        return true;
      }

      const incompleteIntervals = taskEvidence.taskIntervals.filter(
        (interval) =>
          interval.status === 'pending' || interval.status === 'missed',
      );

      const isIncomplete = incompleteIntervals.length > 0;
      this.logger.log(
        `Week ${currentWeek} task status: ${taskEvidence.status}, Incomplete intervals: ${incompleteIntervals.length}`,
      );

      return isIncomplete;
    } catch (error) {
      this.logger.error(`Error checking week completion:`, error);
      return true;
    }
  }

  // Get start of specific week in current month
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

  // Get end of specific week in current month
  getEndOfWeek(date, weekNumber) {
    const startOfWeek = this.getStartOfWeek(date, weekNumber);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
  }

  // Get remaining weekdays for current week
  async getRemainingWeekdaysForCurrentWeek(weekDaysForMonthly, currentWeek, today, taskId) {
    try {
      const currentDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();

      this.logger.log(
        `Checking weekdays: Scheduled [${weekDaysForMonthly.join(', ')}], Today is day ${currentDayOfWeek} (${this.getDayName(currentDayOfWeek)})`,
      );

      const remainingWeekdays = [];

      for (const dayStr of weekDaysForMonthly) {
        const dayNum = parseInt(dayStr);
        const todayWeek = this.getCurrentWeekOfMonth(today);
        if (currentWeek === todayWeek && dayNum < currentDayOfWeek) {
          this.logger.log(
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
          this.logger.log(
            `Day ${dayNum} (${this.getDayName(dayNum)}) - remaining (no evidence)`,
          );
        } else {
          this.logger.log(
            `Day ${dayNum} (${this.getDayName(dayNum)}) - completed (evidence exists)`,
          );
        }
      }

      return remainingWeekdays;
    } catch (error) {
      this.logger.error('Error getting remaining weekdays:', error);
      return weekDaysForMonthly;
    }
  }

  // Check if evidence exists for specific weekday in current week
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
      this.logger.error('Error checking weekday evidence:', error);
      return false;
    }
  }

  // Helper to get specific date for week and day in current month
  getDateForWeekAndDay(currentDate, weekNumber, dayOfWeek) {
    const weekStartDate = this.getStartOfWeek(currentDate, weekNumber);
    const targetDate = new Date(weekStartDate);

    const weekStartDay =
      weekStartDate.getDay() === 0 ? 7 : weekStartDate.getDay();
    const daysToAdd = dayOfWeek - weekStartDay;
    targetDate.setDate(weekStartDate.getDate() + daysToAdd);

    return targetDate;
  }

  // Get dates for weekday in the last week (week 5) of the month
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

  // Check if a date is in the last week (beyond normal 4 weeks)
  isDateInLastWeek(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const week4End = this.getEndOfWeek(date, 4);
    return date.getDate() > week4End.getDate() && date.getDate() <= daysInMonth;
  }

  // Check if monthly task evidence already exists for current month
  async hasMonthlyEvidenceForCurrentMonth(taskId, currentDate) {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const startOfMonth = new Date(year, month, 1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(year, month + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      this.logger.log(
        `DEBUG: Searching for evidence with taskId: ${taskId}, taskFrequency: 'monthly', createdAt between ${startOfMonth.getTime()} and ${endOfMonth.getTime()}`,
      );

      const anyEvidence = await TaskEvidence.findOne({
        taskId: taskId,
      });

      this.logger.log(
        `DEBUG: Any evidence exists for taskId ${taskId}: ${anyEvidence ? 'YES' : 'NO'}`,
      );

      if (anyEvidence) {
        this.logger.log(
          `DEBUG: Found evidence with taskFrequency: ${anyEvidence.taskFrequency}, createdAt: ${anyEvidence.createdAt}`,
        );
      }

      const evidence = await TaskEvidence.findOne({
        taskId: taskId,
        taskFrequency: 'monthly',
        createdAt: {
          $gte: startOfMonth.getTime(),
          $lte: endOfMonth.getTime(),
        },
      });

      const exists = evidence !== null;
      this.logger.log(
        `Checking monthly evidence for ${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}: ${exists ? 'EXISTS' : 'NOT FOUND'}`,
      );

      return exists;
    } catch (error) {
      this.logger.error(
        'Error checking monthly evidence for current month:',
        error,
      );
      return false;
    }
  }

  // Calculate weekday occurrences based on monthWeeks and weekDaysForMonthly
  calculateWeekdayOccurrencesInMonth(weekDaysForMonthly, monthWeeks, currentDate = new Date()) {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const weekdayOccurrences = {};

      weekDaysForMonthly.forEach((day) => {
        weekdayOccurrences[day] = [];
      });

      this.logger.log(
        `Calculating occurrences for weeks: [${monthWeeks.join(', ')}] and weekdays: [${weekDaysForMonthly.join(', ')}]`,
      );

      monthWeeks.forEach((weekStr) => {
        const weekNumber = parseInt(weekStr);

        weekDaysForMonthly.forEach((dayStr) => {
          const dayNumber = parseInt(dayStr);

          if (weekNumber === 5) {
            const lastWeekDates = this.getLastWeekDatesForWeekday(currentDate, dayNumber);
            lastWeekDates.forEach(date => {
              weekdayOccurrences[dayStr].push(date);
              const isToday = date.toDateString() === new Date().toDateString();
              this.logger.log(
                `Week 5 (last week) - ${this.getDayName(dayNumber)} occurs on ${date.toDateString()}${isToday ? ' (TODAY)' : ''}`,
              );
            });
          } else {
            const targetDate = this.getDateForWeekAndDay(currentDate, weekNumber, dayNumber);

            if (targetDate.getMonth() === month && targetDate.getFullYear() === year) {
              weekdayOccurrences[dayStr].push(targetDate);
              const isToday = targetDate.toDateString() === new Date().toDateString();
              this.logger.log(
                `Week ${weekNumber} - ${this.getDayName(dayNumber)} occurs on ${targetDate.toDateString()}${isToday ? ' (TODAY)' : ''}`,
              );
            }
          }
        });
      });

      return weekdayOccurrences;
    } catch (error) {
      this.logger.error('Error calculating weekday occurrences:', error);
      return {};
    }
  }

  // Check if evidence exists for a specific date
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
      this.logger.error('Error checking evidence for date:', error);
      return false;
    }
  }

  // Check if evidence exists for a specific date and user
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
      this.logger.error('Error checking evidence for date and user:', error);
      return false;
    }
  }

  // Get detailed weekday repetition summary with day names and dates
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

  // Helper to get day name for logging
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

module.exports = new TaskManagementMonthly();
