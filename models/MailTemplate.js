const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// User-created email templates for the Mail marketing composer.
const mailTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, default: 'My Templates', trim: true },
  subject: { type: String, default: '' },
  body: { type: String, default: '' },          // text or HTML depending on isHtml
  isHtml: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'mail_templates'
});

mailTemplateSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('MailTemplate', mailTemplateSchema);
