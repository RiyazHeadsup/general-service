const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const appCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  selectedIcon: {
    type: String,
    trim: true
  },
  iconType: {
    type: String,
    enum: ['image', 'color'],
    default: 'image'
  },
  iconColor: {
    type: String,
    trim: true
  },
  selectedIconColor: {
    type: String,
    trim: true
  },
  iconSize: {
    type: Number,
    default: 28
  },
  labelColor: {
    type: String,
    trim: true
  },
  selectedLabelColor: {
    type: String,
    trim: true
  },
  headerBanner: {
    type: String,
    trim: true
  },
  headerBannerType: {
    type: String,
    enum: ['image', 'color'],
    default: 'image'
  },
  headerBannerColor: {
    type: String,
    trim: true
  },
  headerTextColor: {
    type: String,
    trim: true
  },
  headerSubTextColor: {
    type: String,
    trim: true
  },
  categoryBackground: {
    type: String,
    trim: true
  },
  categoryBackgroundType: {
    type: String,
    enum: ['image', 'color'],
    default: 'color'
  },
  categoryBackgroundColor: {
    type: String,
    trim: true
  },
  promotionalBannerHeight: {
    type: Number,
    default: 140
  },
  promotionalBanner: [{
    image: { type: String, trim: true },
    imageType: { type: String, enum: ['image', 'color'], default: 'image' },
    imageColor: { type: String, trim: true },
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    textColor: { type: String, trim: true },
    link: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
  }],
  animatedBannerHeight: {
    type: Number,
    default: 50
  },
  animatedBanner: [{
    text: { type: String, trim: true },
    icon: { type: String, trim: true },
    iconType: { type: String, enum: ['image', 'color'], default: 'image' },
    color: { type: String, trim: true },
    textColor: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
  }],
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

appCategorySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('AppCategory', appCategorySchema);
