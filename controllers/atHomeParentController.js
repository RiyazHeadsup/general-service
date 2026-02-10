const AtHomeParent = require('../models/AtHomeParent');
const AtHomeChildService = require('../models/AtHomeChildService');

class AtHomeParentController {
  async createAtHomeParent(req, res) {
    try {
      const atHomeParent = new AtHomeParent(req.body);
      await atHomeParent.save();
      res.status(200).json({
        success: true,
        message: "at home parent created successfully",
        statusCode: 201,
        data: atHomeParent
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchAtHomeParent(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'unitIds', select: 'unitName unitCode' }
        ]
      };
      const atHomeParents = await AtHomeParent.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: atHomeParents });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateAtHomeParent(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'AtHomeParent ID is required' });
      }

      const atHomeParent = await AtHomeParent.findByIdAndUpdate(_id, req.body, { new: true });
      if (!atHomeParent) {
        return res.status(404).json({ error: 'AtHomeParent not found' });
      }
      res.json({ statusCode: 200, data: atHomeParent });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteAtHomeParent(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'AtHomeParent ID is required' });
      }
      const atHomeParent = await AtHomeParent.findByIdAndRemove(_id);
      if (!atHomeParent) {
        return res.status(404).json({ error: 'AtHomeParent not found' });
      }
      // Delete all children associated with this parent
      await AtHomeChildService.deleteMany({ parentId: _id });
      res.json({ statusCode: 200, message: 'AtHomeParent and all its children deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AtHomeParentController();
