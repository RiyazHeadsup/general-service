const KiosParent = require('../models/KiosParent');
const KiosChild = require('../models/KiosChild');

class KiosParentController {
  async createKiosParent(req, res) {
    try {
      const kiosParent = new KiosParent(req.body);
      await kiosParent.save();
      res.status(200).json({
        success: true,
        message: "kios parent created successfully",
        statusCode: 201,
        data: kiosParent
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchKiosParent(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'unitIds', select: 'unitName unitCode' }
        ]
      };
      const kiosParents = await KiosParent.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: kiosParents });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateKiosParent(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'KiosParent ID is required' });
      }

      const kiosParent = await KiosParent.findByIdAndUpdate(_id, req.body, { new: true });
      if (!kiosParent) {
        return res.status(404).json({ error: 'KiosParent not found' });
      }
      res.json({ statusCode: 200, data: kiosParent });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteKiosParent(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'KiosParent ID is required' });
      }
      const kiosParent = await KiosParent.findByIdAndRemove(_id);
      if (!kiosParent) {
        return res.status(404).json({ error: 'KiosParent not found' });
      }
      // Delete all children associated with this pa
      await KiosChild.deleteMany({ parentId: _id });
      res.json({ statusCode: 200, message: 'KiosParent and all its children deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new KiosParentController();
