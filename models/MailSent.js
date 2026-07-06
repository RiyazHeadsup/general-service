const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// History of individual emails sent via the Mail marketing composer.
const mailSentSchema = new mongoose.Schema({
  to: { type: String, default: '' },
  from: { type: String, default: '' },
  subject: { type: String, default: '' },
  body: { type: String, default: '' },
  isHtml: { type: Boolean, default: true },
  ok: { type: Boolean, default: false },
  error: { type: String, default: '' },
  messageId: { type: String, default: '' }
}, {
  timestamps: true,
  collection: 'mail_sent'
});

mailSentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('MailSent', mailSentSchema);
