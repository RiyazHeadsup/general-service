const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  type: {
    type: String,
    enum: ['booking', 'payment', 'promotion', 'reminder', 'general'],
    default: 'general'
  },
  // For targeted notifications
  clientId: {
    type: String,
    index: true
  },
  // For bulk notifications
  targetType: {
    type: String,
    enum: ['single', 'bulk', 'all'],
    default: 'single'
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'partial'],
    default: 'sent'
  },
  successCount: {
    type: Number,
    default: 0
  },
  failCount: {
    type: Number,
    default: 0
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'notifications'
});

notificationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Notification', notificationSchema);
