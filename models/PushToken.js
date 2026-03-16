const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const pushTokenSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true,
    index: true
  },
  fcmToken: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['ios', 'android', 'web'],
    default: 'android'
  },
  deviceName: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  }
}, {
  timestamps: true,
  collection: 'pushtokens'
});

// Ensure one token per client+device combination
pushTokenSchema.index({ clientId: 1, fcmToken: 1 }, { unique: true });

pushTokenSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('PushToken', pushTokenSchema);
