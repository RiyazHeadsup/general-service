const PushToken = require('../models/PushToken');
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');
const Client = require('../models/Client');

class NotificationController {
  // Register or update FCM token for a client
  async registerPushToken(req, res) {
    try {
      const { clientId, fcmToken, platform, deviceName, unitId } = req.body;

      if (!clientId || !fcmToken) {
        return res.status(400).json({ error: 'clientId and fcmToken are required' });
      }

      // Deactivate this token from other clients (device switched accounts)
      await PushToken.updateMany(
        { fcmToken, clientId: { $ne: clientId } },
        { isActive: false }
      );

      // Upsert: update if same client+token exists, create if not
      const token = await PushToken.findOneAndUpdate(
        { clientId, fcmToken },
        {
          clientId,
          fcmToken,
          platform: platform || 'android',
          deviceName: deviceName || null,
          unitId: unitId || null,
          isActive: true
        },
        { upsert: true, new: true }
      );

      res.status(200).json({
        statusCode: 200,
        message: 'Push token registered successfully',
        data: token
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Remove push token (on logout)
  async removePushToken(req, res) {
    try {
      const { clientId, fcmToken } = req.body;

      if (!clientId || !fcmToken) {
        return res.status(400).json({ error: 'clientId and fcmToken are required' });
      }

      await PushToken.updateOne(
        { clientId, fcmToken },
        { isActive: false }
      );

      res.status(200).json({
        statusCode: 200,
        message: 'Push token removed successfully'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Send notification to a single client
  async sendNotification(req, res) {
    try {
      const { clientId, title, body, data, type, sentBy } = req.body;

      if (!clientId || !title || !body) {
        return res.status(400).json({ error: 'clientId, title and body are required' });
      }

      const result = await notificationService.sendToClient(clientId, title, body, data || {});

      // Save notification record
      const notification = new Notification({
        title,
        body,
        data: data || {},
        type: type || 'general',
        clientId,
        targetType: 'single',
        status: result.fail === 0 ? 'sent' : result.success === 0 ? 'failed' : 'partial',
        successCount: result.success,
        failCount: result.fail,
        sentBy: sentBy || null
      });
      await notification.save();

      res.status(200).json({
        statusCode: 200,
        message: 'Notification sent',
        data: { ...result, notificationId: notification._id }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Appointment updates from billing-service. A person has one Client per
  // unit, and the app registers its push token under the Client it logged in
  // with, which may not be the bill's. So every Client with the same phone
  // number is targeted.
  // Body: { clientId, phoneNumber?, title, body, data?, type? }
  async sendAppointmentNotification(req, res) {
    try {
      const { clientId, phoneNumber, title, body, data, type } = req.body;
      if (!clientId || !title || !body) {
        return res.status(400).json({ error: 'clientId, title and body are required' });
      }

      const ids = new Set([String(clientId)]);
      const last10 = String(phoneNumber || '').replace(/[^\d]/g, '').slice(-10);
      if (last10.length === 10) {
        const sameNumber = await Client.find({ phoneNumber: { $regex: last10 + '$' } }).select('_id').lean();
        sameNumber.forEach(c => ids.add(String(c._id)));
      }

      const tokens = await PushToken.find({ clientId: { $in: [...ids] }, isActive: true }).select('clientId').lean();
      const withTokens = [...new Set(tokens.map(t => t.clientId))];
      const result = await notificationService.sendToClients([...ids], title, body, data || {});

      // One record per app account that has a device, so it shows in that
      // account's notification list
      const recordFor = withTokens.length ? withTokens : [String(clientId)];
      await Notification.insertMany(recordFor.map(id => ({
        title,
        body,
        data: data || {},
        type: type || 'booking',
        clientId: id,
        targetType: 'single',
        status: result.fail === 0 && result.success > 0 ? 'sent' : result.success === 0 ? 'failed' : 'partial',
        successCount: result.success,
        failCount: result.fail
      })));

      res.status(200).json({ statusCode: 200, message: 'Notification sent', data: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Send notification to multiple or all clients
  async sendBulkNotification(req, res) {
    try {
      const { clientIds, title, body, data, type, unitId, sentBy } = req.body;

      if (!title || !body) {
        return res.status(400).json({ error: 'title and body are required' });
      }

      let result;
      let targetType;

      if (clientIds && clientIds.length > 0) {
        result = await notificationService.sendToClients(clientIds, title, body, data || {});
        targetType = 'bulk';
      } else {
        result = await notificationService.sendToAll(title, body, data || {}, unitId || null);
        targetType = 'all';
      }

      // Save notification record
      const notification = new Notification({
        title,
        body,
        data: data || {},
        type: type || 'general',
        targetType,
        unitId: unitId || null,
        status: result.fail === 0 ? 'sent' : result.success === 0 ? 'failed' : 'partial',
        successCount: result.success,
        failCount: result.fail,
        sentBy: sentBy || null
      });
      await notification.save();

      res.status(200).json({
        statusCode: 200,
        message: `Notification sent to ${result.success} device(s)`,
        data: { ...result, notificationId: notification._id }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Search notifications (history)
  async searchNotification(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 20,
        sort: req.body.sort || { createdAt: -1 }
      };
      const notifications = await Notification.paginate(req.body.search || {}, options);
      res.json({ statusCode: 200, data: notifications });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get notifications for a client
  async getClientNotifications(req, res) {
    try {
      const { clientId, page = 1, limit = 20 } = req.body;

      if (!clientId) {
        return res.status(400).json({ error: 'clientId is required' });
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 }
      };

      const notifications = await Notification.paginate(
        { $or: [{ clientId }, { targetType: 'all' }] },
        options
      );
      res.json({ statusCode: 200, data: notifications });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Search push tokens
  async searchPushToken(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 20,
        sort: req.body.sort || { createdAt: -1 }
      };
      const tokens = await PushToken.paginate(req.body.search || {}, options);
      res.json({ statusCode: 200, data: tokens });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new NotificationController();
