const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    trim: true
  },
  barcodes: [{
    type: String,
    trim: true
  }],
  costPrice: {
    type: Number
  },
  mrp: {
    type: Number
  },
  sellPrice: {
    type: Number
  },
  description: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  productType: {
    type: String,
    trim: true
  },
  vendor: {
    type: String,
    trim: true
  },
  productImageUrl: {
    type: String,
    trim: true
  },
  inStockQuantity: {
    type: Number
  },
  quantityAlert: {
    type: Number
  },
  businessType: {
    type: String,
    trim: true
  },
  productUsage: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    trim: true
  },
  netQuantity: {
    type: Number
  },
  costPriceDis: {
    type: Number
  },
  sellPriceDis: {
    type: Number
  },
  usageType: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  unitIds: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: false
  },
  productBrandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductBrand',
    required: false
  },
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
    required: false
  },
  productParentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },
  isTransferred: {
    type: Boolean,
    default: false
  },
  groupUsing: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductGroup'
  }]
}, {
  timestamps: true
});

productSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Product', productSchema);