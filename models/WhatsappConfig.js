const mongoose = require('mongoose');

// Singleton config for the WhatsApp Cloud API (one document, key: 'default').
const whatsappConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'default',
    unique: true,
    index: true
  },
  token: { type: String, default: '' },          // access token — never returned to the client
  phoneNumberId: { type: String, default: '' },
  wabaId: { type: String, default: '' },
  appId: { type: String, default: '' },
  defaultCountryCode: { type: String, default: '91' },
  verifyToken: { type: String, default: '' },     // shared secret used to verify the Meta webhook
  webhookVerified: { type: Boolean, default: false },
  // Cached info from the last successful connection test
  displayPhoneNumber: { type: String, default: '' },
  verifiedName: { type: String, default: '' },
  qualityRating: { type: String, default: '' }
}, {
  timestamps: true,
  collection: 'whatsapp_config'
});

module.exports = mongoose.model('WhatsappConfig', whatsappConfigSchema);
