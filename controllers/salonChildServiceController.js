const SalonChildService = require('../models/SalonChildService');

class SalonChildServiceController {
  async createSalonChildService(req, res) {
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

      const existingService = await SalonChildService.findOne(query);

      if (existingService) {
        const genderText = gender ? ` for ${gender}` : '';
        return res.status(400).json({
          success: false,
          message: `Service "${name}"${genderText} already exists in this group`,
          statusCode: 400
        });
      }

      const salonChildService = new SalonChildService(req.body);
      await salonChildService.save();
      res.status(200).json({
        success: true,
        message: "salon child service created successfully",
        statusCode: 201,
        data: salonChildService
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchSalonChildService(req, res) {
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
      const salonChildServices = await SalonChildService.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: salonChildServices });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateSalonChildService(req, res) {
    try {
      const { _id, name, parentId, unitIds, gender } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'SalonChildService ID is required' });
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

        const existingService = await SalonChildService.findOne(query);

        if (existingService) {
          const genderText = gender ? ` for ${gender}` : '';
          return res.status(400).json({
            success: false,
            message: `Service "${name}"${genderText} already exists in this group`,
            statusCode: 400
          });
        }
      }

      const salonChildService = await SalonChildService.findByIdAndUpdate(_id, req.body, { new: true });
      if (!salonChildService) {
        return res.status(404).json({ error: 'SalonChildService not found' });
      }
      res.json({ statusCode: 200, data: salonChildService });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteSalonChildService(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'SalonChildService ID is required' });
      }
      const salonChildService = await SalonChildService.findByIdAndRemove(_id);
      if (!salonChildService) {
        return res.status(404).json({ error: 'SalonChildService not found' });
      }
      res.json({ statusCode: 200, message: 'SalonChildService deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new SalonChildServiceController();
