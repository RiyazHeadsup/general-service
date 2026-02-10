const mongoose = require('mongoose');

const stockDashboardSchema = new mongoose.Schema({
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
    index: true
  },
  warehouseStock: {
    totalQuantity: {
      type: Number,
      default: 0
    },
    totalValue: {
      type: Number,
      default: 0
    }
  },
  professionalStock: {
    totalQuantity: {
      type: Number,
      default: 0
    },
    totalValue: {
      type: Number,
      default: 0
    }
  },
  retailStock: {
    totalQuantity: {
      type: Number,
      default: 0
    },
    totalValue: {
      type: Number,
      default: 0
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: { currentTime: () => Date.now() }
});

// Index for efficient querying
stockDashboardSchema.index({ warehouseId: 1, isActive: 1 });

module.exports = mongoose.model('StockDashboardModel', stockDashboardSchema);