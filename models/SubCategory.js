const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const subCategorySchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false
  },
  subCategoryParentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: false
  },
  isTransferred: {
    type: Boolean,
    default: false
  },
  groupUsing: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  name: {
    type: String,
    required: false,
    trim: true
  },
  img: {
    type: String,
    required: false,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Unisex'],
    required: false,
    default: 'Unisex'
  },
  serviceFor: {
    type: String,
    enum: ['Adult', 'Child', 'Both'],
    required: false,
    default: 'Both'
  },
  serviceType: {
    type: String,
    enum: ['Salon', 'Wellness'],
    required: false,
    default: 'Salon'
  },
  unitIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

subCategorySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('SubCategory', subCategorySchema);
