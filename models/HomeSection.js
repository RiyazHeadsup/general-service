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

const packageServiceSchema = new mongoose.Schema({
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

const sectionPackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  image: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    default: 0
  },
  discountPrice: {
    type: Number,
    default: 0
  },
  services: {
    type: [packageServiceSchema],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
});

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

const sectionSpecialistSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

const homeSectionSchema = new mongoose.Schema({
  appCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppCategory',
    required: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  image: {
    type: String,
    trim: true
  },
  displayType: {
    type: String,
    enum: ['grid', 'carousel', 'list'],
    default: 'grid'
  },
  columns: {
    type: Number,
    default: 3,
    min: 1,
    max: 6
  },
  sectionType: {
    type: String,
    enum: ['services', 'categories', 'packages', 'specialists'],
    default: 'services'
  },
  services: {
    type: [sectionServiceSchema],
    default: []
  },
  categories: {
    type: [sectionCategorySchema],
    default: []
  },
  packages: {
    type: [sectionPackageSchema],
    default: []
  },
  specialists: {
    type: [sectionSpecialistSchema],
    default: []
  },
  order: {
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

homeSectionSchema.index({ appCategoryId: 1, unitId: 1, order: 1 });
homeSectionSchema.index({ unitId: 1, isActive: 1, order: 1 });

homeSectionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('HomeSection', homeSectionSchema);
