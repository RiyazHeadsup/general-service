const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const bannerSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Unisex'],
    default: 'Unisex'
  },
  title: {
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
  }
}, { _id: true });

const screenConfigSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConfigProject',
    required: true
  },
  banners: {
    type: [bannerSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

screenConfigSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ScreenConfig', screenConfigSchema);
