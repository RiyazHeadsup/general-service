const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const shelfTransferSchema = new mongoose.Schema({
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
  productName: {
    type: String,
    trim: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
    index: true
  },
  transferType: {
    type: String,
    enum: ['warehouse_to_shelf', 'shelf_to_shelf', 'shelf_to_warehouse'],
    required: true,
    index: true
  },
  fromLocation: {
    type: String,
    enum: ['warehouse', 'professional', 'retail'],
    required: true
  },
  toLocation: {
    type: String,
    enum: ['warehouse', 'professional', 'retail'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  quantityBefore: {
    from: {
      type: Number,
      required: true
    },
    to: {
      type: Number,
      required: true
    }
  },
  quantityAfter: {
    from: {
      type: Number,
      required: true
    },
    to: {
      type: Number,
      required: true
    }
  },
  reason: {
    type: String,
    trim: true
  },
  transferDate: {
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
  collection: 'shelf_transfers'
});

shelfTransferSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

shelfTransferSchema.index({ productId: 1, transferDate: -1 });
shelfTransferSchema.index({ unitId: 1, transferDate: -1 });
shelfTransferSchema.index({ createdBy: 1, transferDate: -1 });

shelfTransferSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ShelfTransfer', shelfTransferSchema);