const ProductTransaction = require('../models/ProductTransaction');

class ProductTransactionController {
  async createProductTransaction(req, res) {
    try {
      const productTransaction = new ProductTransaction(req.body);
      await productTransaction.save();
      res.status(200).json({
        success: true,
        message: "product transaction created successfully",
        statusCode: 201,
        data: productTransaction
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchProductTransaction(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { transactionDate: -1 },
        populate: req.body.populate || [
          { path: 'productId', select: 'productName brand' },
          { path: 'unitId', select: 'unitName unitCode' },
          { path: 'fromUnitId', select: 'unitName unitCode' },
          { path: 'toUnitId', select: 'unitName unitCode' },
          { path: 'createdBy', select: 'name email' }
        ]
      };
      const productTransactions = await ProductTransaction.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: productTransactions });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateProductTransaction(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'ProductTransaction ID is required' });
      }
      
      const productTransaction = await ProductTransaction.findByIdAndUpdate(_id, req.body, { new: true });
      if (!productTransaction) {
        return res.status(404).json({ error: 'ProductTransaction not found' });
      }
      res.json({ statusCode: 200, data: productTransaction });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteProductTransaction(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'ProductTransaction ID is required' });
      }
      const productTransaction = await ProductTransaction.findByIdAndRemove(_id);
      if (!productTransaction) {
        return res.status(404).json({ error: 'ProductTransaction not found' });
      }
      res.json({ statusCode: 200, message: 'ProductTransaction deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ProductTransactionController();