const ShelfDashboard = require('../models/ShelfDashboard');

class ShelfDashboardController {
  async createShelfDashboard(req, res) {
    try {
      const shelfDashboard = new ShelfDashboard(req.body);
      await shelfDashboard.save();
      res.status(200).json({
        success: true,
        message: "shelf dashboard created successfully",
        statusCode: 201,
        data: shelfDashboard
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchShelfDashboard(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { date: -1 },
        populate: req.body.populate || [
          { path: 'unitId', select: 'unitName unitCode' },
          { path: 'topProfessionalProducts.productId', select: 'productName brand' },
          { path: 'topRetailProducts.productId', select: 'productName brand' },
          { path: 'lowStockAlerts.productId', select: 'productName brand' }
        ]
      };
      const shelfDashboards = await ShelfDashboard.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: shelfDashboards });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateShelfDashboard(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'ShelfDashboard ID is required' });
      }
      
      const shelfDashboard = await ShelfDashboard.findByIdAndUpdate(_id, req.body, { new: true });
      if (!shelfDashboard) {
        return res.status(404).json({ error: 'ShelfDashboard not found' });
      }
      res.json({ statusCode: 200, data: shelfDashboard });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteShelfDashboard(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'ShelfDashboard ID is required' });
      }
      const shelfDashboard = await ShelfDashboard.findByIdAndRemove(_id);
      if (!shelfDashboard) {
        return res.status(404).json({ error: 'ShelfDashboard not found' });
      }
      res.json({ statusCode: 200, message: 'ShelfDashboard deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ShelfDashboardController();