const mongoose = require('mongoose');

// Singleton config for the outbound email (SMTP) sending account.
// One document, key: 'default'. The app password is never returned to the client.
const mailConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'default',
    unique: true,
    index: true
  },
  provider: { type: String, default: 'gmail' },   // gmail | outlook | m365 | yahoo | custom
  host: { type: String, default: '' },
  port: { type: Number, default: 587 },
  secure: { type: Boolean, default: false },
  user: { type: String, default: '' },            // sender email address
  pass: { type: String, default: '' },            // app password — never returned to the client
  fromName: { type: String, default: '' },        // display name shown in the inbox
  verified: { type: Boolean, default: false },    // last connection test passed
  lastVerifiedAt: { type: Date, default: null }
}, {
  timestamps: true,
  collection: 'mail_config'
});

module.exports = mongoose.model('MailConfig', mailConfigSchema);
