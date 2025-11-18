const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const stockSchema = new mongoose.Schema({
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['professional', 'retail'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['transferd', 'recevied','instock','rejected'],
    index: true
  },
  place: {
    type: String,
    enum: ['shelves', 'inStock','warehouse','salon'],
    required: true,
    index: true
  },
  stockLocation: {
    type: String,
    enum: ['warehouse','salon'],
    required: true,
    index: true
  },qty: {
    type: Number,
    default: 0,
    required: true
  },
  stockIn: {
    type: Number,
    default: 0,
    required: true
  },
  stockAlert: {
    type: Number,
    default: 0
  },
  stockOut: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: { currentTime: () => Date.now() }
});

// Compound index for unique shelf inventory per product/unit/shelf type
// stockSchema.index({ productId: 1, unitId: 1, type: 1 });

stockSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Stock', stockSchema);