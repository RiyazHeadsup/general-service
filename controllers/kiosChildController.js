const KiosChild = require('../models/KiosChild');

class KiosChildController {
  async createKiosChild(req, res) {
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

      const existingService = await KiosChild.findOne(query);

      if (existingService) {
        const genderText = gender ? ` for ${gender}` : '';
        return res.status(400).json({
          success: false,
          message: `Service "${name}"${genderText} already exists in this group`,
          statusCode: 400
        });
      }

      const kiosChild = new KiosChild(req.body);
      await kiosChild.save();
      res.status(200).json({
        success: true,
        message: "kios child created successfully",
        statusCode: 201,
        data: kiosChild
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchKiosChild(req, res) {
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
      const kiosChildren = await KiosChild.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: kiosChildren });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateKiosChild(req, res) {
    try {
      const { _id, name, parentId, unitIds, gender } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'KiosChild ID is required' });
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

        const existingService = await KiosChild.findOne(query);

        if (existingService) {
          const genderText = gender ? ` for ${gender}` : '';
          return res.status(400).json({
            success: false,
            message: `Service "${name}"${genderText} already exists in this group`,
            statusCode: 400
          });
        }
      }

      const kiosChild = await KiosChild.findByIdAndUpdate(_id, req.body, { new: true });
      if (!kiosChild) {
        return res.status(404).json({ error: 'KiosChild not found' });
      }
      res.json({ statusCode: 200, data: kiosChild });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteKiosChild(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'KiosChild ID is required' });
      }
      const kiosChild = await KiosChild.findByIdAndRemove(_id);
      if (!kiosChild) {
        return res.status(404).json({ error: 'KiosChild not found' });
      }
      res.json({ statusCode: 200, message: 'KiosChild deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new KiosChildController();
