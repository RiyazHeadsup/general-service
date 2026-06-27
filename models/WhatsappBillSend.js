const mongoose = require('mongoose');

// Records which bills have been sent to the customer on WhatsApp,
// so the panel can show "Already sent" and disable the button.
const whatsappBillSendSchema = new mongoose.Schema({
  billId: { type: String, required: true, unique: true, index: true },
  billNumber: { type: String, default: '' },
  phone: { type: String, default: '' },
  messageId: { type: String, default: '' },
  sentAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'whatsapp_bill_sends'
});

module.exports = mongoose.model('WhatsappBillSend', whatsappBillSendSchema);
