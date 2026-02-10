const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const deviceSchema = new mongoose.Schema({
  deviceCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  deviceName: {
    type: String,
    required: true,
    trim: true
  },
  deviceType: {
    type: String,
    required: true,
    trim: true,
    enum: ['Mobile', 'Television', 'Screen', 'Billboard']
  },
  isVertical: {
    type: Boolean,
    default: true
  },
  resolution: {
    type: String,
    required: true,
    trim: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Inactive', 'Maintenance'],
    default: 'Active'
  },
  orientation: {
    type: String,
    required: true,
    enum: ['vertical', 'horizontal'],
    default: 'vertical'
  },
  unitIds: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: false
  }
}, {
  timestamps: true,
  collection: 'devices'
});

deviceSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Device', deviceSchema);
