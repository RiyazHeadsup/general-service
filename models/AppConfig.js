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
  },
  categoriesConfig: {
    salon: {
      title: { type: String, default: 'What do you want to do?' },
      displayType: { type: String, enum: ['grid', 'horizontal_scroll', 'list'], default: 'grid' }
    },
    athome: {
      title: { type: String, default: 'At Home Services' },
      displayType: { type: String, enum: ['grid', 'horizontal_scroll', 'list'], default: 'grid' }
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AppConfig', appConfigSchema);
