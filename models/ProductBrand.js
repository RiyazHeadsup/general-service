const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const productBrandSchema = new mongoose.Schema({
  productSubCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductSubCategory',
    required: false
  },
  productCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory',
    required: false
  },
  productGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductGroup',
    required: true
  },
  productBrandParentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductBrand',
    required: false
  },
  isTransferred: {
    type: Boolean,
    default: false
  },
  groupUsing: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductGroup'
  }],
  name: {
    type: String,
    trim: true
  },
  img: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
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

productBrandSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ProductBrand', productBrandSchema);
