const General = require('../models/General');

class GeneralController {
  async createGeneral(req, res) {
    try {
      const general = new General(req.body);
      await general.save();
      res.status(200).json({
        success: true,
        message: "general created successfully",
        statusCode: 201,
        data: general
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchGeneral(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 }
      };
      const generals = await General.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: generals });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateGeneral(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'General ID is required' });
      }
      
      const general = await General.findByIdAndUpdate(_id, req.body, { new: true });
      if (!general) {
        return res.status(404).json({ error: 'General not found' });
      }
      res.json({ statusCode: 200, data: general });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteGeneral(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'General ID is required' });
      }
      const general = await General.findByIdAndRemove(_id);
      if (!general) {
        return res.status(404).json({ error: 'General not found' });
      }
      res.json({ statusCode: 200, message: 'General deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new GeneralController();