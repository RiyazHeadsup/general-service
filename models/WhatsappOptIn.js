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
  messageCount: { type: Number, default: 0 },

  // Marketing consent, stored against the phone number itself so it survives
  // whether or not the sender has a Client record yet. A walk-in who scans the
  // counter QR before their first bill is exactly the person we want to reach,
  // and Meta only cares that the customer initiated consent — not that they
  // exist in our billing DB. Copied onto the Client when one is created.
  optIn:        { type: Boolean, default: false, index: true },
  optInText:    { type: String, default: '' },   // their own words — the proof
  optInSource:  { type: String, default: '' },   // whatsapp_inbound | whatsapp_stop
  consentAt:    { type: Date }                   // when they opted in/out
}, {
  timestamps: true,
  collection: 'whatsapp_optins'
});

whatsappOptInSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('WhatsappOptIn', whatsappOptInSchema);
