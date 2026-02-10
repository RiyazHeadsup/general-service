const ChildService = require('../models/ChildService');

class ChildServiceController {
  async createChildService(req, res) {
    try {
      const childService = new ChildService(req.body);
      await childService.save();
      res.status(200).json({
        success: true,
        message: "child service created successfully",
        statusCode: 201,
        data: childService
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchChildService(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'parentId', select: 'name' },
          { path: 'staffIds', select: 'name email' },
          { path: 'unitIds', select: 'unitName unitCode' }
        ]
      };
      const childServices = await ChildService.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: childServices });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateChildService(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'ChildService ID is required' });
      }
      
      const childService = await ChildService.findByIdAndUpdate(_id, req.body, { new: true });
      if (!childService) {
        return res.status(404).json({ error: 'ChildService not found' });
      }
      res.json({ statusCode: 200, data: childService });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteChildService(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'ChildService ID is required' });
      }
      const childService = await ChildService.findByIdAndRemove(_id);
      if (!childService) {
        return res.status(404).json({ error: 'ChildService not found' });
      }
      res.json({ statusCode: 200, message: 'ChildService deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ChildServiceController();