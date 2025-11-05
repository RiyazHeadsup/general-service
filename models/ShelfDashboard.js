const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const shelfDashboardSchema = new mongoose.Schema({
  date: {
    type: Number,
    required: true,
    index: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
    index: true
  },
  
  // Warehouse Summary
  warehouseSummary: {
    totalProducts: {
      type: Number,
      default: 0
    },
    totalQuantity: {
      type: Number,
      default: 0
    },
    totalValue: {
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
    }
  },

  // Professional Shelf Summary
  professionalShelf: {
    totalProducts: {
      type: Number,
      default: 0
    },
    totalQuantity: {
      type: Number,
      default: 0
    },
    totalValue: {
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
    quantityUsed: {
      type: Number,
      default: 0
    },
    valueUsed: {
      type: Number,
      default: 0
    }
  },

  // Retail Shelf Summary
  retailShelf: {
    totalProducts: {
      type: Number,
      default: 0
    },
    totalQuantity: {
      type: Number,
      default: 0
    },
    totalValue: {
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
    quantitySold: {
      type: Number,
      default: 0
    },
    valueSold: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },

  // Transfer Activities
  transferActivity: {
    warehouseToProfessional: {
      count: { type: Number, default: 0 },
      quantity: { type: Number, default: 0 }
    },
    warehouseToRetail: {
      count: { type: Number, default: 0 },
      quantity: { type: Number, default: 0 }
    },
    professionalToWarehouse: {
      count: { type: Number, default: 0 },
      quantity: { type: Number, default: 0 }
    },
    retailToWarehouse: {
      count: { type: Number, default: 0 },
      quantity: { type: Number, default: 0 }
    },
    professionalToRetail: {
      count: { type: Number, default: 0 },
      quantity: { type: Number, default: 0 }
    },
    retailToProfessional: {
      count: { type: Number, default: 0 },
      quantity: { type: Number, default: 0 }
    }
  },

  // Top Products by Shelf Type
  topProfessionalProducts: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    quantityUsed: Number,
    valueUsed: Number
  }],

  topRetailProducts: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    quantitySold: Number,
    revenue: Number
  }],

  // Low Stock Alerts
  lowStockAlerts: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    location: {
      type: String,
      enum: ['warehouse', 'professional', 'retail']
    },
    currentQuantity: Number,
    alertQuantity: Number
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
  collection: 'shelf_dashboards'
});

shelfDashboardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Unique compound index - one dashboard per unit per date
shelfDashboardSchema.index({ date: 1, unitId: 1 }, { unique: true });

shelfDashboardSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ShelfDashboard', shelfDashboardSchema);