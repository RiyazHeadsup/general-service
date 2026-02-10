const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema({
  unitIds: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
    unique: true
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

module.exports = mongoose.model('AppConfig', appConfigSchema);
