const ConfigProject = require('../models/ConfigProject');
const AppBanner = require('../models/AppBanner');
const AppSectionClient = require('../models/AppSectionClient');
const AppConfig = require('../models/AppConfig');

class ConfigProjectController {
  async addConfigProject(req, res) {
    try {
      const { unitIds, name, description } = req.body;

      if (!unitIds) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'unitIds is required' });
      }
      if (!name) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'name is required' });
      }

      // Check for duplicate name in same unit
      const existing = await ConfigProject.findOne({ unitIds, name: name.trim() });
      if (existing) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Project with this name already exists for this unit' });
      }

      const configProject = new ConfigProject({
        unitIds,
        name: name.trim(),
        description: description?.trim() || '',
        isActive: true
      });
      await configProject.save();

      res.status(200).json({
        success: true,
        message: 'Config project created successfully',
        statusCode: 201,
        data: configProject
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async searchConfigProject(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 50,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'unitIds', select: 'unitName unitCode' }
        ]
      };
      const result = await ConfigProject.paginate(req.body.search || {}, options);
      res.json({ success: true, statusCode: 200, data: result });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async updateConfigProject(req, res) {
    try {
      const { _id, name, description, isActive } = req.body;
      if (!_id) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'ConfigProject ID is required' });
      }

      const existing = await ConfigProject.findById(_id);
      if (!existing) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'ConfigProject not found' });
      }

      // Check for duplicate name if name is being changed
      if (name && name.trim() !== existing.name) {
        const duplicate = await ConfigProject.findOne({
          unitIds: existing.unitIds,
          name: name.trim(),
          _id: { $ne: _id }
        });
        if (duplicate) {
          return res.status(400).json({ success: false, statusCode: 400, message: 'Project with this name already exists for this unit' });
        }
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (isActive !== undefined) updateData.isActive = isActive;

      const configProject = await ConfigProject.findByIdAndUpdate(_id, updateData, { new: true, runValidators: true });

      res.json({ success: true, statusCode: 200, message: 'ConfigProject updated successfully', data: configProject });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async deleteConfigProject(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'ConfigProject ID is required' });
      }

      // Check if there's associated data
      const [bannersCount, sectionsCount, configCount] = await Promise.all([
        AppBanner.countDocuments({ projectId: _id }),
        AppSectionClient.countDocuments({ projectId: _id }),
        AppConfig.countDocuments({ projectId: _id })
      ]);

      const totalAssociated = bannersCount + sectionsCount + configCount;
      if (totalAssociated > 0) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: `Cannot delete project. It has ${bannersCount} banners, ${sectionsCount} sections, and ${configCount > 0 ? 'app config' : 'no config'} associated with it. Please delete or move these items first.`,
          data: { bannersCount, sectionsCount, configCount }
        });
      }

      const configProject = await ConfigProject.findByIdAndDelete(_id);
      if (!configProject) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'ConfigProject not found' });
      }

      res.json({ success: true, statusCode: 200, message: 'ConfigProject deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }
}

module.exports = new ConfigProjectController();
