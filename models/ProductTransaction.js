const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const productTransactionSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'warehouse',
    required: true,
    index: true
  },
  productName: {
    type: String,
    trim: true
  },
  transactionType: {
    type: String,
    enum: ['in', 'out', 'adjustment', 'transfer', 'return', 'damaged', 'expired'],
    required: true,
    index: true
  },
  transactionKey: {
    type: String,
    enum: ['in', 'out'],
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true
  },
  quantityBefore: {
    type: Number,
    required: true
  },
  quantityAfter: {
    type: Number,
    required: true
  },
  unitPrice: {
    type: Number
  },
  totalValue: {
    type: Number
  },
  reason: {
    type: String,
    trim: true
  },
  referenceType: {
    type: String,
    enum: ['bill', 'purchase_order', 'manual', 'transfer', 'return', 'adjustment']
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  vendor: {
    type: String,
    trim: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
    index: true
  },
  fromUnitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  },
  toUnitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  },
  transactionDate: {
    type: Number,
    required: true,
    default: Date.now,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Number,
    default: Date.now
  },
  updatedAt: {
    type: Number,
    default: Date.now
  }
}, {
  collection: 'product_transactions'
});

productTransactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

productTransactionSchema.index({ productId: 1, transactionDate: -1 });
productTransactionSchema.index({ unitId: 1, transactionDate: -1 });
productTransactionSchema.index({ transactionType: 1, transactionDate: -1 });
productTransactionSchema.index({ createdBy: 1, transactionDate: -1 });

productTransactionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ProductTransaction', productTransactionSchema);