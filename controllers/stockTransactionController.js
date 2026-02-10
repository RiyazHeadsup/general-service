const StockTransaction = require('../models/StockTransactionModel');
const Stock = require('../models/StockModel');

class StockTransactionController {
  async createStockTransaction(req, res) {
    try {
      const { stockId, transferQuantity, status } = req.body;
      
      // Set default status if not provided
      const transactionData = {
        ...req.body,
        status: status || 'instock'
      };
      
      // Create stock transaction
      const stockTransaction = new StockTransaction(transactionData);
      await stockTransaction.save();
      
      // If status is 'transferd', update the original stock
      if (status === 'transferd' && stockId && transferQuantity) {
        const originalStock = await Stock.findById(stockId);
        if (originalStock) {
          console.log('Before update:', { 
            stockIn: originalStock.stockIn,
            qty: originalStock.qty,
            stockOut: originalStock.stockOut, 
            transferQuantity 
          });
          
          // Reduce stock from original location by transfer quantity only
          // Update both stockIn and qty fields
          originalStock.stockIn -= transferQuantity;
          originalStock.qty -= transferQuantity;
          originalStock.stockOut += transferQuantity;
          await originalStock.save();
          
          console.log('After update:', { 
            stockIn: originalStock.stockIn,
            qty: originalStock.qty,
            stockOut: originalStock.stockOut 
          });
        }
      }
      
      res.status(201).json({
        success: true,
        message: "Stock transaction created successfully",
        statusCode: 201,
        data: stockTransaction
      });
    } catch (error) {
      res.status(400).json({ 
        success: false,
        message: "Failed to create stock transaction",
        statusCode: 400,
        error: error.message 
      });
    }
  }

  async searchStockTransaction(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'stockId', select: 'stockIn stockOut' },
          { path: 'warehouseId', select: 'warehouseName address' },
          { path: 'productId', select: 'productName brand' },
          { path: 'unitId', select: 'unitName unitCode' }
        ]
      };
      const stockTransactions = await StockTransaction.paginate(req.body.search || {}, options);
      res.json({ 
        success: true,
        statusCode: 200, 
        data: stockTransactions 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        statusCode: 500, 
        error: error.message 
      });
    }
  }

  async updateStockTransaction(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ 
          success: false,
          message: 'Stock transaction ID is required',
          statusCode: 400
        });
      }
      
      const stockTransaction = await StockTransaction.findByIdAndUpdate(_id, req.body, { 
        new: true,
        runValidators: true
      });
      
      if (!stockTransaction) {
        return res.status(404).json({ 
          success: false,
          message: 'Stock transaction not found',
          statusCode: 404
        });
      }
      
      res.json({ 
        success: true,
        message: "Stock transaction updated successfully",
        statusCode: 200, 
        data: stockTransaction 
      });
    } catch (error) {
      res.status(400).json({ 
        success: false,
        message: "Failed to update stock transaction",
        statusCode: 400,
        error: error.message 
      });
    }
  }

  async deleteStockTransaction(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ 
          success: false,
          message: 'Stock transaction ID is required',
          statusCode: 400
        });
      }
      
      const stockTransaction = await StockTransaction.findByIdAndDelete(_id);
      if (!stockTransaction) {
        return res.status(404).json({ 
          success: false,
          message: 'Stock transaction not found',
          statusCode: 404
        });
      }
      
      res.json({ 
        success: true,
        message: 'Stock transaction deleted successfully',
        statusCode: 200 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to delete stock transaction",
        statusCode: 500,
        error: error.message 
      });
    }
  }

  async cancelStockTransaction(req, res) {
    try {
      const { _id } = req.body;
      
      if (!_id) {
        return res.status(400).json({ 
          success: false,
          message: 'Stock transaction ID is required',
          statusCode: 400
        });
      }

      // Find the transaction to cancel
      const stockTransaction = await StockTransaction.findById(_id);
      if (!stockTransaction) {
        return res.status(404).json({ 
          success: false,
          message: 'Stock transaction not found',
          statusCode: 404
        });
      }

      // Check if transaction was already transferred
      if (stockTransaction.status !== 'transferd') {
        return res.status(400).json({ 
          success: false,
          message: 'Can only cancel transferred transactions',
          statusCode: 400
        });
      }

      // Restock the original stock if it was a transfer
      if (stockTransaction.stockId && stockTransaction.transferQuantity) {
        const originalStock = await Stock.findById(stockTransaction.stockId);
        if (originalStock) {
          console.log('Before restock:', { 
            stockIn: originalStock.stockIn,
            qty: originalStock.qty,
            stockOut: originalStock.stockOut,
            transferQuantity: stockTransaction.transferQuantity
          });
          
          // Restore stock to original location
          originalStock.stockIn += stockTransaction.transferQuantity;
          originalStock.qty += stockTransaction.transferQuantity;
          originalStock.stockOut -= stockTransaction.transferQuantity;
          await originalStock.save();
          
          console.log('After restock:', { 
            stockIn: originalStock.stockIn,
            qty: originalStock.qty,
            stockOut: originalStock.stockOut
          });
        }
      }

      // Update transaction status to cancelled
      stockTransaction.status = 'cancelled';
      await stockTransaction.save();
      
      res.json({ 
        success: true,
        message: 'Stock transaction cancelled and stock restored successfully',
        statusCode: 200,
        data: stockTransaction
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to cancel stock transaction",
        statusCode: 500,
        error: error.message 
      });
    }
  }

  async acceptStockTransaction(req, res) {
    try {
      const { _id } = req.body;
      
      if (!_id) {
        return res.status(400).json({ 
          success: false,
          message: 'Stock transaction ID is required',
          statusCode: 400
        });
      }

      // Find the transaction to accept
      const stockTransaction = await StockTransaction.findById(_id);
      if (!stockTransaction) {
        return res.status(404).json({ 
          success: false,
          message: 'Stock transaction not found',
          statusCode: 404
        });
      }

      // Check if transaction can be accepted (should be 'transferd')
      if (stockTransaction.status !== 'transferd') {
        return res.status(400).json({ 
          success: false,
          message: 'Can only accept transferred transactions',
          statusCode: 400
        });
      }

      // Add stock to receiving warehouse/location
      if (stockTransaction.warehouseId && stockTransaction.productId && stockTransaction.transferQuantity) {
        // Check if stock already exists at receiving warehouse for this product
        const existingStock = await Stock.findOne({
          productId: stockTransaction.productId,
          unitId: stockTransaction.unitId,
          stockLocation:stockTransaction.stockLocation
        });

        if (existingStock) {
          // Update existing stock
          console.log('Before receiving update:', { 
            stockIn: existingStock.stockIn,
            qty: existingStock.qty,
            transferQuantity: stockTransaction.transferQuantity
          });
          
          existingStock.stockIn += stockTransaction.transferQuantity;
          existingStock.qty += stockTransaction.transferQuantity;
          await existingStock.save();
          
          console.log('After receiving update:', { 
            stockIn: existingStock.stockIn,
            qty: existingStock.qty
          });
        } else {
      
          const stockData = { ...stockTransaction.toObject() };
              // Create new stock at receiving location
          stockData.stockIn = stockTransaction.transferQuantity;
          stockData.qty = stockTransaction.transferQuantity;
          delete stockData._id;
          const newStock = new Stock(stockData);
          await newStock.save();
          
          console.log('New stock created at receiving warehouse:', {
            stockIn: newStock.stockIn,
            qty: newStock.qty
          });
        }
      }

      // Update transaction status to received
      stockTransaction.status = 'received';
      await stockTransaction.save();
      
      res.json({ 
        success: true,
        message: 'Stock transaction accepted and stock added to receiving warehouse successfully',
        statusCode: 200,
        data: stockTransaction
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to accept stock transaction",
        statusCode: 500,
        error: error.message 
      });
    }
  }

  async rejectStockTransaction(req, res) {
    try {
      const { _id } = req.body;
      
      if (!_id) {
        return res.status(400).json({ 
          success: false,
          message: 'Stock transaction ID is required',
          statusCode: 400
        });
      }

      // Find the transaction to reject
      const stockTransaction = await StockTransaction.findById(_id);
      if (!stockTransaction) {
        return res.status(404).json({ 
          success: false,
          message: 'Stock transaction not found',
          statusCode: 404
        });
      }

      // Check if transaction can be rejected (should be 'transferd')
      if (stockTransaction.status !== 'transferd') {
        return res.status(400).json({ 
          success: false,
          message: 'Can only reject transferred transactions',
          statusCode: 400
        });
      }

      // Update current transaction status to rejected
      stockTransaction.status = 'rejected';
      const updatedTransaction = await stockTransaction.save();
      
      console.log('Transaction updated to rejected:', {
        transactionId: stockTransaction._id,
        newStatus: updatedTransaction.status
      });

      // Create new transaction for return (salon to warehouse)
      const returnTransactionData = {
        ...stockTransaction.toObject(),
        status: 'transferd',
        // Swap source and destination - return from salon to warehouse
        place:stockTransaction.place === 'salon' ? 'warehouse' : 'salon',
        transferFrom : stockTransaction.transferFrom === 'warehouse' ? 'salon' : 'warehouse',
        transactionReason:'stock_return',
        stockLocation: stockTransaction.stockLocation === 'salon' ? 'warehouse' : 'salon', 

      };
      
      delete returnTransactionData._id;
      delete returnTransactionData.createdAt;
      delete returnTransactionData.updatedAt;
      
      const returnTransaction = new StockTransaction(returnTransactionData);
      await returnTransaction.save();

      console.log('Return transaction created:', {
        originalTransactionId: stockTransaction._id,
        returnTransactionId: returnTransaction._id,
        fromLocation: stockTransaction.stockLocation,
        toLocation: returnTransaction.stockLocation
      });
      
      res.json({ 
        success: true,
        message: 'Stock transaction rejected and return transaction created successfully',
        statusCode: 200,
        data: {
          rejectedTransaction: stockTransaction,
          returnTransaction: returnTransaction
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to reject stock transaction",
        statusCode: 500,
        error: error.message 
      });
    }
  }
}

module.exports = new StockTransactionController();