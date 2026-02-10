const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const appBannerSchema = new mongoose.Schema({
  unitIds: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'all'],
    default: 'all'
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

appBannerSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('AppBanner', appBannerSchema);
