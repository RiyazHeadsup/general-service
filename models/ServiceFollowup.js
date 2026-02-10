const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const serviceFollowupItemSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChildService',
    required: true
  },
  originalPrice: {
    type: String,
    required: true,
    trim: true
  },
  negotiated: {
    type: String,
    required: true,
    trim: true
  },
  followupDate: {
    type: Number,
    required: true
  },
  discount: {
    type: String,
    trim: true
  },
  communication: {
    type: String,
    trim: true
  }
}, { _id: false });

const serviceFollowupSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  followupBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'completed', 'cancelled'],
    default: 'active',
    trim: true
  },
  serviceFollowup: [serviceFollowupItemSchema]
}, {
  timestamps: true
});

serviceFollowupSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ServiceFollowup', serviceFollowupSchema);
