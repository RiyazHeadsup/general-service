const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const stockSchema = new mongoose.Schema({
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: true,
    index: true
  },
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
    enum: ['transferd', 'received','instock','cancelled','rejected'],
  },
  place: {
    type: String,
    enum: ['salon-shelves','warehouse','salon'],
    required: true,
    index: true
  },
  stockLocation: {
    type: String,
    enum: ['warehouse','salon'],
    required: true,
    index: true
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
  },
  transactionReason: {
    type: String,
    index: true
  },
  transferFrom: {
    type: String,
    index: true
  },
  transferNotes: {
    type: String
  },
  transferQuantity: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: { currentTime: () => Date.now() }
});

// Compound index for shelf inventory per product/unit/shelf type
stockSchema.index({ productId: 1, unitId: 1, type: 1 });

stockSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('StockTransfer', stockSchema);