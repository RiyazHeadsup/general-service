const InventoryTransaction = require('../models/InventoryTransaction');

class InventoryTransactionController {
  async addInventoryTransaction(req, res) {
    try {
      const transaction = new InventoryTransaction(req.body);
      await transaction.save();
      res.status(200).json({
        success: true,
        message: "Transaction recorded successfully",
        statusCode: 201,
        data: transaction
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchInventoryTransaction(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'productId', select: 'productName brand productType' },
          { path: 'inventoryId' },
          { path: 'unitIds', select: 'unitName unitCode' },
          { path: 'createdBy', select: 'name email' }
        ]
      };
      const transactions = await InventoryTransaction.paginate(req.body.search || {}, options);
      res.json({ statusCode: 200, data: transactions });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateInventoryTransaction(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Transaction ID is required' });
      }

      const transaction = await InventoryTransaction.findByIdAndUpdate(_id, req.body, { new: true });
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json({ statusCode: 200, data: transaction });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteInventoryTransaction(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Transaction ID is required' });
      }
      const transaction = await InventoryTransaction.findByIdAndRemove(_id);
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json({ statusCode: 200, message: 'Transaction deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new InventoryTransactionController();
