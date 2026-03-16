const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Push Token Management
router.post('/registerPushToken', notificationController.registerPushToken);
router.post('/removePushToken', notificationController.removePushToken);
router.post('/searchPushToken', notificationController.searchPushToken);

// Send Notifications
router.post('/sendNotification', notificationController.sendNotification);
router.post('/sendBulkNotification', notificationController.sendBulkNotification);

// Notification History
router.post('/searchNotification', notificationController.searchNotification);
router.post('/getClientNotifications', notificationController.getClientNotifications);

module.exports = router;
