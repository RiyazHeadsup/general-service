const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const sectionServiceSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

const sectionCategorySchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory'
  },
  itemType: {
    type: String,
    enum: ['category', 'subcategory'],
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
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConfigProject',
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
  serviceType: {
    type: String,
    trim: true,
    default: ''
  },
  image: {
    type: String,
    trim: true
  },
  services: {
    type: [sectionServiceSchema],
    default: []
  },
  sectionType: {
    type: String,
    enum: ['services', 'categories'],
    default: 'services'
  },
  categories: {
    type: [sectionCategorySchema],
    default: []
  }
}, {
  timestamps: true
});

// Compound index for slug per unit and project (non-unique to allow duplicates)
appSectionClientSchema.index({ unitIds: 1, projectId: 1, slug: 1 });

// Index for querying active sections by unit
appSectionClientSchema.index({ unitIds: 1, isActive: 1, order: 1 });

appSectionClientSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('AppSectionClient', appSectionClientSchema);
