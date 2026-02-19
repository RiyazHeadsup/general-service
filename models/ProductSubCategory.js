const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const productSubCategorySchema = new mongoose.Schema({
  productCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory',
    required: true
  },
  productGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductGroup',
    required: false
  },
  productSubCategoryParentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductSubCategory',
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

productSubCategorySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ProductSubCategory', productSubCategorySchema);
