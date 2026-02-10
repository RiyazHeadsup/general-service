const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const sectionServiceSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalonChildService',
    required: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

const appSectionClientSchema = new mongoose.Schema({
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
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
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
  displayType: {
    type: String,
    enum: ['horizontal_scroll', 'grid', 'list'],
    default: 'horizontal_scroll'
  },
  services: {
    type: [sectionServiceSchema],
    default: []
  }
}, {
  timestamps: true
});

// Compound index for unique slug per unit
appSectionClientSchema.index({ unitIds: 1, slug: 1 }, { unique: true });

// Index for querying active sections by unit
appSectionClientSchema.index({ unitIds: 1, isActive: 1, order: 1 });

appSectionClientSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('AppSectionClient', appSectionClientSchema);
