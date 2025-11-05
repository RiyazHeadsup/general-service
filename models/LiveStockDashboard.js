const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const liveStockDashboardSchema = new mongoose.Schema({
  date: {
    type: Number,
    index: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    index: true
  },
  totalProducts: {
    type: Number,
    default: 0
  },
  totalStockValue: {
    type: Number,
    default: 0
  },
  totalCostValue: {
    type: Number,
    default: 0
  },
  lowStockProducts: {
    type: Number,
    default: 0
  },
  outOfStockProducts: {
    type: Number,
    default: 0
  },
  stockIn: {
    type: Number,
    default: 0
  },
  stockOut: {
    type: Number,
    default: 0
  },
  adjustments: {
    type: Number,
    default: 0
  },
  topProducts: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse'
    },
    productName: String,
    quantitySold: Number
  }],
  createdAt: {
    type: Number,
    default: Date.now
  },
  updatedAt: {
    type: Number,
    default: Date.now
  }
}, {
  collection: 'live_stock_dashboards'
});

liveStockDashboardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

liveStockDashboardSchema.index({ date: 1, unitId: 1 }, { unique: true });

liveStockDashboardSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('live_stock_dashboards', liveStockDashboardSchema);