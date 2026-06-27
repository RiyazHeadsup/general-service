const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// A customer who messaged the business on WhatsApp (an opt-in).
// lastInboundAt drives the 24-hour customer-service window in the panel.
const whatsappOptInSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: { type: String, default: '' },
  lastMessage: { type: String, default: '' },
  lastInboundAt: { type: Date, index: true },
  optInAt: { type: Date, default: Date.now },   // first time they ever messaged
  messageCount: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'whatsapp_optins'
});

whatsappOptInSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('WhatsappOptIn', whatsappOptInSchema);
