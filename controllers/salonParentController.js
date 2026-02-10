const SalonParent = require('../models/SalonParent');
const SalonChildService = require('../models/SalonChildService');

class SalonParentController {
  async createSalonParent(req, res) {
    try {
      const salonParent = new SalonParent(req.body);
      await salonParent.save();
      res.status(200).json({
        success: true,
        message: "salon parent created successfully",
        statusCode: 201,
        data: salonParent
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchSalonParent(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'unitIds', select: 'unitName unitCode' }
        ]
      };
      const salonParents = await SalonParent.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: salonParents });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateSalonParent(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'SalonParent ID is required' });
      }

      const salonParent = await SalonParent.findByIdAndUpdate(_id, req.body, { new: true });
      if (!salonParent) {
        return res.status(404).json({ error: 'SalonParent not found' });
      }
      res.json({ statusCode: 200, data: salonParent });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteSalonParent(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'SalonParent ID is required' });
      }
      const salonParent = await SalonParent.findByIdAndRemove(_id);
      if (!salonParent) {
        return res.status(404).json({ error: 'SalonParent not found' });
      }
      // Delete all children associated with this parent
      await SalonChildService.deleteMany({ parentId: _id });
      res.json({ statusCode: 200, message: 'SalonParent and all its children deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new SalonParentController();
