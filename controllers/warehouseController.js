const Warehouse = require('../models/Warehouse');
const ProductTransaction = require('../models/ProductTransaction');
const LiveStockDashboard = require('../models/LiveStockDashboard');
const mongoose = require('mongoose');

class WarehouseController {
  async createWarehouse(req, res) {
    try {
      const warehouse = new Warehouse(req.body);
      await warehouse.save();
      res.status(200).json({
        success: true,
        message: "warehouse created successfully",
        statusCode: 201,
        data: warehouse
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchWarehouse(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'productId', select: 'productName brand barcodes costPrice mrp sellPrice' },
          { path: 'unitId', select: 'unitName unitCode' }
        ]
      };
      const warehouses = await Warehouse.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: warehouses });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateWarehouse(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Warehouse ID is required' });
      }
      
      const warehouse = await Warehouse.findByIdAndUpdate(_id, req.body, { new: true });
      if (!warehouse) {
        return res.status(404).json({ error: 'Warehouse not found' });
      }
      res.json({ statusCode: 200, data: warehouse });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteWarehouse(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Warehouse ID is required' });
      }
      const warehouse = await Warehouse.findByIdAndRemove(_id);
      if (!warehouse) {
        return res.status(404).json({ error: 'Warehouse not found' });
      }
      res.json({ statusCode: 200, message: 'Warehouse deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async addProductInWarehouse(req, res) {
    try {
      const { 
        productId, 
        quantity, 
        unitPrice, 
        unitId, 
        createdBy, 
        reason, 
        notes 
      } = req.body;

      if (!productId || !quantity || !unitId || !createdBy) {
        return res.status(400).json({ 
          error: 'ProductId, quantity, unitId, and createdBy are required' 
        });
      }

      let warehouse = await Warehouse.findOne({ productId, unitId }).populate('productId');
      
      if (!warehouse) {
        warehouse = new Warehouse({
          productId,
          unitId,
          quantity: 0
        });
      }

      const quantityBefore = warehouse.quantity || 0;
      const quantityAfter = quantityBefore + quantity;
      const totalValue = unitPrice ? quantity * unitPrice : 0;

      warehouse.quantity = quantityAfter;
      await warehouse.save();
      await warehouse.populate('productId');

      const productTransaction = new ProductTransaction({
        productId,
        productName: warehouse.productId.productName,
        transactionType: 'in',
        transactionKey: 'in',
        quantity,
        quantityBefore,
        quantityAfter,
        unitPrice,
        totalValue,
        reason: reason || 'Production added',
        referenceType: 'manual',
        unitId,
        transactionDate: Date.now(),
        createdBy,
        notes
      });

      await productTransaction.save();

      // Update LiveStockDashboard
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();

      let dashboard = await LiveStockDashboard.findOne({ 
        date: todayTimestamp, 
        unitId 
      });

      // Get current warehouse statistics for the unit
      const warehouseStats = await Warehouse.aggregate([
        { $match: { unitId: new mongoose.Types.ObjectId(unitId) } },
        { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStockValue: { $sum: { $multiply: ['$quantity', '$product.sellPrice'] } },
            totalCostValue: { $sum: { $multiply: ['$quantity', '$product.costPrice'] } },
            lowStockProducts: { 
              $sum: { 
                $cond: [
                  { $and: [
                    { $gt: ['$quantityAlert', 0] }, 
                    { $gt: ['$quantity', 0] },
                    { $lte: ['$quantity', '$quantityAlert'] }
                  ]}, 
                  1, 
                  0
                ] 
              } 
            },
            outOfStockProducts: { $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] } }
          }
        }
      ]);

      const stats = warehouseStats[0] || {
        totalProducts: 0,
        totalStockValue: 0,
        totalCostValue: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0
      };

      if (!dashboard) {
        dashboard = new LiveStockDashboard({
          date: todayTimestamp,
          unitId,
          totalProducts: stats.totalProducts,
          totalStockValue: stats.totalStockValue,
          totalCostValue: stats.totalCostValue,
          lowStockProducts: stats.lowStockProducts,
          outOfStockProducts: stats.outOfStockProducts,
          stockIn: quantity,
          stockOut: 0,
          adjustments: 0,
          topProducts: []
        });
      } else {
        dashboard.totalProducts = stats.totalProducts;
        dashboard.totalStockValue = stats.totalStockValue;
        dashboard.totalCostValue = stats.totalCostValue;
        dashboard.lowStockProducts = stats.lowStockProducts;
        dashboard.outOfStockProducts = stats.outOfStockProducts;
        dashboard.stockIn += quantity;
      }

      await dashboard.save();

      res.status(200).json({
        success: true,
        message: "Production added successfully",
        statusCode: 200,
        data: {
          warehouse,
          transaction: productTransaction,
          dashboard
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new WarehouseController();