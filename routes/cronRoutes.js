const express = require('express');
const cronController = require('../controllers/cronController');

const router = express.Router();

// Cron trigger routes
router.post('/trigger-daily-task', cronController.triggerDailyTask.bind(cronController));
router.post('/trigger-monthly-task', cronController.triggerMonthlyTask.bind(cronController));

// Debug route
router.get('/debug-monthly-tasks', cronController.debugMonthlyTasks.bind(cronController));

// Status route
router.get('/cron-status', cronController.getStatus.bind(cronController));

module.exports = router;
