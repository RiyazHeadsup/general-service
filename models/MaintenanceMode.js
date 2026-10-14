const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const maintenanceModeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  isEnabled: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  allowedRoles: [{
    type: String,
    trim: true
  }],
  unitIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  }],
  enabledBy: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

maintenanceModeSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('MaintenanceMode', maintenanceModeSchema);
