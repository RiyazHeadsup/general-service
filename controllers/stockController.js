const Stock = require('../models/StockModel');

class StockController {
  async createStock(req, res) {
    try {
      const { warehouseId, productId, unitId, type, place, stockIn, qty } = req.body;
      
      // Check if stock already exists with same warehouseId, productId, unitId, type, and place
      const existingStock = await Stock.findOne({ 
        warehouseId, 
        productId, 
        unitId, 
        type, 
        place 
      });
      
      if (existingStock) {
        // Update existing stock quantities
        existingStock.stockIn += stockIn || 0;
        existingStock.qty += qty || 0;
        await existingStock.save();
        
        res.status(200).json({
          success: true,
          message: "Stock quantity updated successfully",
          statusCode: 200,
          data: existingStock
        });
      } else {
        // Create new stock entry
        const stock = new Stock(req.body);
        await stock.save();
        
        res.status(201).json({
          success: true,
          message: "Stock created successfully",
          statusCode: 201,
          data: stock
        });
      }
    } catch (error) {
      res.status(400).json({ 
        success: false,
        message: "Failed to create stock",
        statusCode: 400,
        error: error.message 
      });
    }
  }

  async searchStock(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'warehouseId', select: 'warehouseName address' },
          { path: 'productId', select: 'productName brand' },
          { path: 'unitId', select: 'unitName unitCode' }
        ]
      };
      const stocks = await Stock.paginate(req.body.search || {}, options);
      res.json({ 
        success: true,
        statusCode: 200, 
        data: stocks 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        statusCode: 500, 
        error: error.message 
      });
    }
  }

  async getStockById(req, res) {
    try {
      const { id } = req.params;
      const stock = await Stock.findById(id)
        .populate('warehouseId', 'warehouseName address')
        .populate('productId', 'productName brand')
        .populate('unitId', 'unitName unitCode');
      
      if (!stock) {
        return res.status(404).json({ 
          success: false,
          message: 'Stock not found',
          statusCode: 404
        });
      }
      
      res.json({ 
        success: true,
        statusCode: 200, 
        data: stock 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        statusCode: 500, 
        error: error.message 
      });
    }
  }

  async updateStock(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ 
          success: false,
          message: 'Stock ID is required',
          statusCode: 400
        });
      }
      
      const stock = await Stock.findByIdAndUpdate(_id, req.body, { 
        new: true,
        runValidators: true
      });
      
      if (!stock) {
        return res.status(404).json({ 
          success: false,
          message: 'Stock not found',
          statusCode: 404
        });
      }
      
      res.json({ 
        success: true,
        message: "Stock updated successfully",
        statusCode: 200, 
        data: stock 
      });
    } catch (error) {
      res.status(400).json({ 
        success: false,
        message: "Failed to update stock",
        statusCode: 400,
        error: error.message 
      });
    }
  }

  async deleteStock(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ 
          success: false,
          message: 'Stock ID is required',
          statusCode: 400
        });
      }
      
      const stock = await Stock.findByIdAndDelete(_id);
      if (!stock) {
        return res.status(404).json({ 
          success: false,
          message: 'Stock not found',
          statusCode: 404
        });
      }
      
      res.json({ 
        success: true,
        message: 'Stock deleted successfully',
        statusCode: 200 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to delete stock",
        statusCode: 500,
        error: error.message 
      });
    }
  }

  async getStockByWarehouse(req, res) {
    try {
      const { warehouseId } = req.params;
      const stocks = await Stock.find({ warehouseId, isActive: true })
        .populate('productId', 'productName brand')
        .populate('unitId', 'unitName unitCode')
        .sort({ createdAt: -1 });
      
      res.json({ 
        success: true,
        statusCode: 200, 
        data: stocks 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        statusCode: 500, 
        error: error.message 
      });
    }
  }

  async getLowStockItems(req, res) {
    try {
      const { warehouseId } = req.params;
      const query = warehouseId ? { warehouseId } : {};
      
      const lowStockItems = await Stock.find({
        ...query,
        isActive: true,
        $expr: { $lte: ["$stockIn", "$stockAlert"] }
      })
      .populate('warehouseId', 'warehouseName address')
      .populate('productId', 'productName brand')
      .populate('unitId', 'unitName unitCode')
      .sort({ stockIn: 1 });
      
      res.json({ 
        success: true,
        statusCode: 200, 
        data: lowStockItems 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        statusCode: 500, 
        error: error.message 
      });
    }
  }

  async updateStockQuantity(req, res) {
    try {
      const { stockId, quantity, operation, field } = req.body; // operation: 'add' | 'subtract' | 'set', field: 'stockIn' | 'qty'
      
      if (!stockId || quantity === undefined || !operation) {
        return res.status(400).json({ 
          success: false,
          message: 'stockId, quantity, and operation are required',
          statusCode: 400
        });
      }

      const stock = await Stock.findById(stockId);
      if (!stock) {
        return res.status(404).json({ 
          success: false,
          message: 'Stock not found',
          statusCode: 404
        });
      }

      const targetField = field || 'stockIn'; // default to stockIn if not specified

      switch (operation) {
        case 'add':
          stock[targetField] += quantity;
          break;
        case 'subtract':
          if (stock[targetField] < quantity) {
            return res.status(400).json({ 
              success: false,
              message: `Insufficient ${targetField} quantity`,
              statusCode: 400
            });
          }
          stock[targetField] -= quantity;
          if (targetField === 'stockIn' || targetField === 'qty') {
            stock.stockOut += quantity;
          }
          break;
        case 'set':
          stock[targetField] = quantity;
          break;
        default:
          return res.status(400).json({ 
            success: false,
            message: 'Invalid operation. Use add, subtract, or set',
            statusCode: 400
          });
      }

      await stock.save();
      
      res.json({ 
        success: true,
        message: "Stock quantity updated successfully",
        statusCode: 200, 
        data: stock 
      });
    } catch (error) {
      res.status(400).json({ 
        success: false,
        message: "Failed to update stock quantity",
        statusCode: 400,
        error: error.message 
      });
    }
  }
}

module.exports = new StockController();