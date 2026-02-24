const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const paymentMethodSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConfigProject',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  image: {
    type: String,
    default: null
  },
  upiId: {
    type: String,
    default: null
  },
  payeeName: {
    type: String,
    default: null
  },
  upiLink: {
    type: String,
    default: null
  },
  transactionNote: {
    type: String,
    default: null
  },
  currency: {
    type: String,
    default: 'INR'
  },
  defaultAmount: {
    type: Number,
    default: null
  }
}, {
  timestamps: true,
  collection: 'paymentmethods'
});

paymentMethodSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
