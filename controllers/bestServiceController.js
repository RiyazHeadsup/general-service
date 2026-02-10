const BestService = require('../models/BestService');

class BestServiceController {
  async createBestService(req, res) {
    try {
      const { name, unitIds } = req.body;

      // Check for duplicate name in same unit
      const existingService = await BestService.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        unitIds: unitIds
      });

      if (existingService) {
        return res.status(400).json({
          success: false,
          message: `Best Service "${name}" already exists`,
          statusCode: 400
        });
      }

      const bestService = new BestService(req.body);
      await bestService.save();
      res.status(201).json({
        success: true,
        message: "Best service created successfully",
        statusCode: 201,
        data: bestService
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchBestService(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'staffIds', select: 'name email' },
          { path: 'unitIds', select: 'unitName unitCode' },
          { path: 'products.product', select: 'name productCode' }
        ]
      };
      const bestServices = await BestService.paginate(req.body.search || {}, options);
      res.json({ statusCode: 200, data: bestServices });
    } catch (error) {
      res.status(500).json({ statusCode: 500, error: error.message });
    }
  }

  async updateBestService(req, res) {
    try {
      const { _id, name, unitIds } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'BestService ID is required' });
      }

      // Check for duplicate name in same unit (excluding current record)
      if (name) {
        const existingService = await BestService.findOne({
          _id: { $ne: _id },
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          unitIds: unitIds
        });

        if (existingService) {
          return res.status(400).json({
            success: false,
            message: `Best Service "${name}" already exists`,
            statusCode: 400
          });
        }
      }

      const bestService = await BestService.findByIdAndUpdate(_id, req.body, { new: true });
      if (!bestService) {
        return res.status(404).json({ error: 'BestService not found' });
      }
      res.json({ statusCode: 200, data: bestService });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteBestService(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'BestService ID is required' });
      }
      const bestService = await BestService.findByIdAndRemove(_id);
      if (!bestService) {
        return res.status(404).json({ error: 'BestService not found' });
      }
      res.json({ statusCode: 200, message: 'BestService deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new BestServiceController();
