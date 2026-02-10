const Inventory = require('../models/Inventory');

class InventoryController {
  async createInventory(req, res) {
    try {
      const inventory = new Inventory(req.body);
      await inventory.save();
      res.status(200).json({
        success: true,
        message: "inventory created successfully",
        statusCode: 201,
        data: inventory
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchInventory(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'productId', select: 'productName brand productType' },
          { path: 'unitIds', select: 'unitName unitCode' }
        ]
      };
      const inventories = await Inventory.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: inventories });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateInventory(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Inventory ID is required' });
      }
      
      const inventory = await Inventory.findByIdAndUpdate(_id, req.body, { new: true });
      if (!inventory) {
        return res.status(404).json({ error: 'Inventory not found' });
      }
      res.json({ statusCode: 200, data: inventory });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteInventory(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Inventory ID is required' });
      }
      const inventory = await Inventory.findByIdAndRemove(_id);
      if (!inventory) {
        return res.status(404).json({ error: 'Inventory not found' });
      }
      res.json({ statusCode: 200, message: 'Inventory deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new InventoryController();