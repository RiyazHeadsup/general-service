const AtHomeChildService = require('../models/AtHomeChildService');

class AtHomeChildServiceController {
  async createAtHomeChildService(req, res) {
    try {
      const { name, parentId, unitIds, gender } = req.body;

      // Check for duplicate name + gender in same parent and unit
      const query = {
        name: { $regex: new RegExp(`^${name}$`, 'i') }, // Case-insensitive match
        parentId: parentId,
        unitIds: unitIds
      };

      // Add gender to query if provided
      if (gender) {
        query.gender = gender;
      }

      const existingService = await AtHomeChildService.findOne(query);

      if (existingService) {
        const genderText = gender ? ` for ${gender}` : '';
        return res.status(400).json({
          success: false,
          message: `Service "${name}"${genderText} already exists in this group`,
          statusCode: 400
        });
      }

      const atHomeChildService = new AtHomeChildService(req.body);
      await atHomeChildService.save();
      res.status(200).json({
        success: true,
        message: "at home child service created successfully",
        statusCode: 201,
        data: atHomeChildService
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchAtHomeChildService(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'parentId', select: 'name' },
          { path: 'staffIds', select: 'name email' },
          { path: 'unitIds', select: 'unitName unitCode' },
          { path: 'products.product', select: 'name productCode' }
        ]
      };
      const atHomeChildServices = await AtHomeChildService.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: atHomeChildServices });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateAtHomeChildService(req, res) {
    try {
      const { _id, name, parentId, unitIds, gender } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'AtHomeChildService ID is required' });
      }

      // Check for duplicate name + gender in same parent and unit (excluding current record)
      if (name) {
        const query = {
          _id: { $ne: _id }, // Exclude current record
          name: { $regex: new RegExp(`^${name}$`, 'i') }, // Case-insensitive match
          parentId: parentId,
          unitIds: unitIds
        };

        // Add gender to query if provided
        if (gender) {
          query.gender = gender;
        }

        const existingService = await AtHomeChildService.findOne(query);

        if (existingService) {
          const genderText = gender ? ` for ${gender}` : '';
          return res.status(400).json({
            success: false,
            message: `Service "${name}"${genderText} already exists in this group`,
            statusCode: 400
          });
        }
      }

      const atHomeChildService = await AtHomeChildService.findByIdAndUpdate(_id, req.body, { new: true });
      if (!atHomeChildService) {
        return res.status(404).json({ error: 'AtHomeChildService not found' });
      }
      res.json({ statusCode: 200, data: atHomeChildService });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteAtHomeChildService(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'AtHomeChildService ID is required' });
      }
      const atHomeChildService = await AtHomeChildService.findByIdAndRemove(_id);
      if (!atHomeChildService) {
        return res.status(404).json({ error: 'AtHomeChildService not found' });
      }
      res.json({ statusCode: 200, message: 'AtHomeChildService deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AtHomeChildServiceController();
