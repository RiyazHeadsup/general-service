const ParentService = require('../models/ParentService');

class ParentServiceController {
  async createParentService(req, res) {
    try {
      const parentService = new ParentService(req.body);
      await parentService.save();
      res.status(200).json({
        success: true,
        message: "parent service created successfully",
        statusCode: 201,
        data: parentService
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchParentService(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'unitIds', select: 'unitName unitCode' }
        ]
      };
      const parentServices = await ParentService.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: parentServices });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateParentService(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'ParentService ID is required' });
      }
      
      const parentService = await ParentService.findByIdAndUpdate(_id, req.body, { new: true });
      if (!parentService) {
        return res.status(404).json({ error: 'ParentService not found' });
      }
      res.json({ statusCode: 200, data: parentService });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteParentService(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'ParentService ID is required' });
      }
      const parentService = await ParentService.findByIdAndRemove(_id);
      if (!parentService) {
        return res.status(404).json({ error: 'ParentService not found' });
      }
      res.json({ statusCode: 200, message: 'ParentService deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ParentServiceController();