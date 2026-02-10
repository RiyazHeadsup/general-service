# Task Evidence Creation Guide

This document explains how daily and monthly task evidences are created automatically.

## Overview

The system now creates **TaskEvidence** documents in the database (not just updating Task intervals) for both daily and monthly tasks.

## Services

### 1. TaskManagementDaily Service
**Location:** `/general-service/services/TaskManagementDaily.js`

**Purpose:** Creates daily task evidence in the TaskEvidence collection

**Features:**
- ✅ Creates TaskEvidence documents for each day
- ✅ Supports both common and individual tasks (`isCommon` flag)
- ✅ Prevents duplicate evidence creation
- ✅ Handles tasks with assigned users
- ✅ Creates default intervals if none defined
- ✅ Detailed logging for debugging

### 2. TaskManagementMonthly Service
**Location:** `/general-service/services/TaskManagementMonthly.js`

**Purpose:** Creates monthly task evidence based on week and weekday configuration

**Features:**
- ✅ Creates TaskEvidence for specific weeks and weekdays
- ✅ Supports week 1-5 (week 5 = last week of month)
- ✅ Prevents duplicate evidence creation using `taskcreatedformonth`
- ✅ Supports both common and individual tasks
- ✅ Skips past dates automatically
- ✅ Comprehensive logging

## API Endpoints

### Trigger Daily Task Evidence Creation
```
POST http://localhost:8073/generalservice/trigger-daily-task
```

**Response:**
```json
{
  "result": {
    "success": true,
    "processedCount": 5,
    "createdCount": 5,
    "skippedCount": 0,
    "details": [
      {
        "taskId": "...",
        "taskName": "Daily Inspection",
        "action": "created",
        "evidenceCount": 1,
        "evidenceIds": ["..."],
        "date": "Sun Dec 15 2025"
      }
    ]
  },
  "success": true,
  "message": "Daily task evidence creation triggered successfully",
  "timestamp": "2025-12-15T08:00:00.000Z"
}
```

### Trigger Monthly Task Evidence Creation
```
POST http://localhost:8073/generalservice/trigger-monthly-task
```

**Response:**
```json
{
  "result": {
    "success": true,
    "totalTasks": 3,
    "successfulCreations": 10,
    "failedCreations": 0,
    "tasksSummary": [...],
    "createdEvidences": [...]
  },
  "success": true,
  "message": "Monthly task evidence creation triggered successfully",
  "timestamp": "2025-12-15T08:00:00.000Z"
}
```

### Debug Daily Tasks
```
GET http://localhost:8073/generalservice/debug-daily-tasks
```

Shows detailed information about all daily tasks and why they are/aren't creating evidence.

### Debug Monthly Tasks
```
GET http://localhost:8073/generalservice/debug-monthly-tasks
```

Shows detailed information about all monthly tasks and their scheduled dates.

## How It Works

### Daily Tasks

1. Finds all active daily tasks with:
   - `taskFrequency: 'daily'`
   - `status: 'active'`
   - `startDateTime` <= today
   - `endDateTime` >= today (or null)

2. For each task:
   - Checks if evidence already exists for today
   - Checks if task has assigned users
   - Creates TaskEvidence document(s):
     - If `isCommon === false`: Creates separate evidence for each user
     - If `isCommon === true` (or undefined): Creates single evidence for all users

3. TaskEvidence includes:
   - Task details (name, description, priority, etc.)
   - Task intervals (time slots for the day)
   - Assigned users
   - Status: 'pending'
   - createdAt: Start of today

### Monthly Tasks

1. Finds all active monthly tasks with:
   - `taskFrequency: 'monthly'`
   - `status: 'active'`

2. For each task:
   - Checks if already created for current month using `taskcreatedformonth`
   - Calculates dates based on:
     - `weekDaysForMonthly`: Array of weekdays (1=Mon, 2=Tue, ..., 7=Sun)
     - `monthWeeks`: Array of weeks (1, 2, 3, 4, 5)
   - Creates TaskEvidence for each calculated date that:
     - Is not in the past
     - Doesn't already have evidence

3. Updates task's `taskcreatedformonth` field after creation

## Task Configuration

### Daily Task Example
```javascript
{
  taskName: "Daily Inspection",
  taskFrequency: "daily",
  status: "active",
  startDateTime: 1734220800000, // Start date
  endDateTime: null, // No end date
  assignedTo: ["user1", "user2"],
  isCommon: true, // or false for individual tasks
  taskIntervals: [
    {
      start: 1734249600000, // 9:00 AM
      end: 1734253200000,   // 10:00 AM
      interval: "daily"
    }
  ]
}
```

### Monthly Task Example
```javascript
{
  taskName: "Weekly Meeting",
  taskFrequency: "monthly",
  status: "active",
  weekDaysForMonthly: ["1", "3"], // Monday and Wednesday
  monthWeeks: ["1", "3"], // First and third week
  assignedTo: ["user1", "user2"],
  isCommon: true,
  taskcreatedformonth: null, // Gets updated after creation
  taskIntervals: [
    {
      start: 1734249600000, // 9:00 AM
      end: 1734253200000,   // 10:00 AM
      interval: "monthly"
    }
  ]
}
```

## Common vs Individual Tasks

### Common Tasks (`isCommon: true` or undefined)
- Creates **ONE** TaskEvidence document
- All users assigned to that single evidence
- All users see and work on the same evidence

### Individual Tasks (`isCommon: false`)
- Creates **SEPARATE** TaskEvidence documents for each user
- Each user has their own evidence to complete
- Users don't see each other's evidence

## Preventing Duplicates

### Daily Tasks
- Checks if TaskEvidence exists for:
  - Same taskId
  - createdAt between start and end of today
  - (For individual tasks) Same userId

### Monthly Tasks
- Uses `taskcreatedformonth` field on Task model
- If current month matches `taskcreatedformonth`, skips creation
- Also checks TaskEvidence for specific dates

## Troubleshooting

### No Evidence Created?

1. Check if tasks exist:
   ```
   GET /generalservice/debug-daily-tasks
   GET /generalservice/debug-monthly-tasks
   ```

2. Common reasons:
   - ❌ No tasks with correct frequency
   - ❌ Tasks are not active (`status !== 'active'`)
   - ❌ No users assigned (`assignedTo` is empty)
   - ❌ Start date is in future
   - ❌ End date has passed
   - ❌ Evidence already exists for today/this month

### Check Database

```javascript
// Check TaskEvidence collection
db.taskevidences.find({ taskFrequency: 'daily' }).sort({ createdAt: -1 })
db.taskevidences.find({ taskFrequency: 'monthly' }).sort({ createdAt: -1 })

// Check Tasks
db.tasks.find({ taskFrequency: 'daily', status: 'active' })
db.tasks.find({ taskFrequency: 'monthly', status: 'active' })
```

## Automation (Cron Setup)

To run these automatically:

```javascript
// Daily at midnight (00:00)
0 0 * * * curl -X POST http://localhost:8073/generalservice/trigger-daily-task

// Monthly on 1st of each month
0 0 1 * * curl -X POST http://localhost:8073/generalservice/trigger-monthly-task
```

Or use node-cron in your application:

```javascript
const cron = require('node-cron');

// Daily at 00:00
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily task creation...');
  await TaskManagementDaily.addDailyTask();
});

// Monthly on 1st at 00:00
cron.schedule('0 0 1 * *', async () => {
  console.log('Running monthly task creation...');
  await TaskManagementMonthly.addMonthlyTask();
});
```

## Testing

### Test Daily Task Creation
```bash
curl -X POST http://localhost:8073/generalservice/trigger-daily-task
```

### Test Monthly Task Creation
```bash
curl -X POST http://localhost:8073/generalservice/trigger-monthly-task
```

### Debug
```bash
curl http://localhost:8073/generalservice/debug-daily-tasks
curl http://localhost:8073/generalservice/debug-monthly-tasks
```
