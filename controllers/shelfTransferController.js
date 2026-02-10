const ShelfTransfer = require('../models/ShelfTransfer');

class ShelfTransferController {
  async createShelfTransfer(req, res) {
    try {
      const shelfTransfer = new ShelfTransfer(req.body);
      await shelfTransfer.save();
      res.status(200).json({
        success: true,
        message: "shelf transfer created successfully",
        statusCode: 201,
        data: shelfTransfer
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchShelfTransfer(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { transferDate: -1 },
        populate: req.body.populate || [
          { path: 'warehouseId', select: 'warehouseName address' },
          { path: 'productId'},
          { path: 'unitId', select: 'unitName unitCode' },
          { path: 'createdBy', select: 'firstName lastName email' }
        ]
      };
      const shelfTransfers = await ShelfTransfer.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: shelfTransfers });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateShelfTransfer(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'ShelfTransfer ID is required' });
      }
      
      const shelfTransfer = await ShelfTransfer.findByIdAndUpdate(_id, req.body, { new: true });
      if (!shelfTransfer) {
        return res.status(404).json({ error: 'ShelfTransfer not found' });
      }
      res.json({ statusCode: 200, data: shelfTransfer });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteShelfTransfer(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'ShelfTransfer ID is required' });
      }
      const shelfTransfer = await ShelfTransfer.findByIdAndRemove(_id);
      if (!shelfTransfer) {
        return res.status(404).json({ error: 'ShelfTransfer not found' });
      }
      res.json({ statusCode: 200, message: 'ShelfTransfer deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ShelfTransferController();