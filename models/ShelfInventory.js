const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const shelfInventorySchema = new mongoose.Schema({
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
  shelfType: {
    type: String,
    enum: ['professional', 'retail'],
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    default: 0,
    required: true
  },
  quantityAlert: {
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

// Compound index for unique shelf inventory per product/unit/shelf type
shelfInventorySchema.index({ productId: 1, unitId: 1, shelfType: 1 }, { unique: true });

shelfInventorySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ShelfInventory', shelfInventorySchema);