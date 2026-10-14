const { admin } = require('../config/firebase');
const PushToken = require('../models/PushToken');

class NotificationService {
  // Send notification to a single client
  async sendToClient(clientId, title, body, data = {}) {
    const tokens = await PushToken.find({ clientId, isActive: true });
    if (tokens.length === 0) return { success: 0, fail: 0 };

    const fcmTokens = tokens.map(t => t.fcmToken).filter(Boolean);
    return this._sendNotifications(fcmTokens, title, body, data);
  }

  // Send notification to multiple clients
  async sendToClients(clientIds, title, body, data = {}) {
    const tokens = await PushToken.find({ clientId: { $in: clientIds }, isActive: true });
    const fcmTokens = tokens.map(t => t.fcmToken).filter(Boolean);
    return this._sendNotifications(fcmTokens, title, body, data);
  }

  // Send notification to all registered clients
  async sendToAll(title, body, data = {}, unitId = null) {
    const query = { isActive: true };
    if (unitId) query.unitId = unitId;

    const tokens = await PushToken.find(query);
    const fcmTokens = tokens.map(t => t.fcmToken).filter(Boolean);
    return this._sendNotifications(fcmTokens, title, body, data);
  }

  // Core FCM notification sender
  async _sendNotifications(fcmTokens, title, body, data = {}) {
    if (fcmTokens.length === 0) return { success: 0, fail: 0 };

    // Convert all data values to strings (FCM requires string values)
    const stringData = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }

    const message = {
      notification: { title, body },
      data: stringData,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'elevate-default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    let success = 0;
    let fail = 0;

    // Send in batches of 500 (FCM limit)
    const batchSize = 500;
    for (let i = 0; i < fcmTokens.length; i += batchSize) {
      const batch = fcmTokens.slice(i, i + batchSize);

      try {
        const response = await admin.messaging().sendEachForMulticast({
          tokens: batch,
          ...message,
        });

        success += response.successCount;
        fail += response.failureCount;

        // Deactivate invalid tokens
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered'
            ) {
              PushToken.updateOne({ fcmToken: batch[idx] }, { isActive: false }).catch(() => {});
            }
          }
        });
      } catch (error) {
        console.error('FCM batch send error:', error);
        fail += batch.length;
      }
    }

    return { success, fail };
  }
}

module.exports = new NotificationService();
