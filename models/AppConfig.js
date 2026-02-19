const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema({
  unitIds: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConfigProject',
    required: true
  },
  maintenanceMode: {
    enabled: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: 'We are currently under maintenance. Please check back soon.'
    }
  },
  bannerControl: {
    enabled: {
      type: Boolean,
      default: true
    }
  },
  bookingEnabled: {
    type: Boolean,
    default: true
  },
  showPrices: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound unique index for unit and project
appConfigSchema.index({ unitIds: 1, projectId: 1 }, { unique: true });

module.exports = mongoose.model('AppConfig', appConfigSchema);
