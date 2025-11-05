const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const warehouseSchema = new mongoose.Schema({
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

warehouseSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Warehouse', warehouseSchema);