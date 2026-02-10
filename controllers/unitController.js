const Unit = require('../models/Unit');

class UnitController {
  async createUnit(req, res) {
    try {
      const unit = new Unit(req.body);
      await unit.save();
      res.status(200).json({
        success: true,
        message: "unit created successfully",
        statusCode: 201,
        data: unit
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchUnit(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        // populate: req.body.populate || {}
      };
      const units = await Unit.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: units });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateUnit(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Unit ID is required' });
      }
      
      const unit = await Unit.findByIdAndUpdate(_id, req.body, { new: true });
      if (!unit) {
        return res.status(404).json({ error: 'Unit not found' });
      }
      res.json({ statusCode: 200, data: unit });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteUnit(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Unit ID is required' });
      }
      const unit = await Unit.findByIdAndRemove(_id);
      if (!unit) {
        return res.status(404).json({ error: 'Unit not found' });
      }
      res.json({statusCode:200, message: 'Unit deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUnitById(req, res) {
    try {
      const { id } = req.params;
      const unit = await Unit.findById(id);
      if (!unit) {
        return res.status(404).json({ error: 'Unit not found' });
      }
      res.json(unit);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllUnits(req, res) {
    try {
      const units = await Unit.find({ status: 'active' }).sort({ createdAt: -1 });
      res.json(units);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  getHealth(req, res) {
    res.json({ status: 'healthy', service: 'general-service' });
  }
}

module.exports = new UnitController();