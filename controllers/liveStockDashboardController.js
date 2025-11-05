const LiveStockDashboard = require('../models/LiveStockDashboard');
const Warehouse = require('../models/Warehouse');

class LiveStockDashboardController {
  async createLiveStockDashboard(req, res) {
    try {
      const liveStockDashboard = new LiveStockDashboard(req.body);
      await liveStockDashboard.save();
      res.status(200).json({
        success: true,
        message: "live stock dashboard created successfully",
        statusCode: 201,
        data: liveStockDashboard
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchLiveStockDashboard(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { date: -1 },
        populate: req.body.populate || [
          { path: 'unitId', select: 'unitName unitCode' },
          { path: 'topProducts.productId', select: 'productName brand' }
        ]
      };
      const liveStockDashboards = await LiveStockDashboard.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: liveStockDashboards });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateLiveStockDashboard(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'LiveStockDashboard ID is required' });
      }
      
      const liveStockDashboard = await LiveStockDashboard.findByIdAndUpdate(_id, req.body, { new: true });
      if (!liveStockDashboard) {
        return res.status(404).json({ error: 'LiveStockDashboard not found' });
      }
      res.json({ statusCode: 200, data: liveStockDashboard });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteLiveStockDashboard(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'LiveStockDashboard ID is required' });
      }
      const liveStockDashboard = await LiveStockDashboard.findByIdAndRemove(_id);
      if (!liveStockDashboard) {
        return res.status(404).json({ error: 'LiveStockDashboard not found' });
      }
      res.json({ statusCode: 200, message: 'LiveStockDashboard deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new LiveStockDashboardController();