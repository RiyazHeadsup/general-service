const mongoose = require('mongoose');
const MaintenanceMode = require('../models/MaintenanceMode');
// Registered for populate
require('../models/Unit');

// Admin CRUD for app-wide maintenance notices (`maintenancemodes`). The gateway
// serves the public getMaintenanceStatus from the same collection.

const badId = (res, field = 'maintenance mode ID') =>
  res.status(400).json({ success: false, statusCode: 400, message: `Invalid ${field}` });

const addMaintenanceMode = async (req, res) => {
  try {
    const maintenanceMode = new MaintenanceMode(req.body);
    await maintenanceMode.save();
    res.status(201).json({ success: true, statusCode: 201, message: 'Maintenance mode created successfully', data: maintenanceMode });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error creating maintenance mode', error: error.message });
  }
};

const searchMaintenanceMode = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      isEnabled,
      unitIds
    } = req.body || {};

    const query = {};
    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { enabledBy: { $regex: search, $options: 'i' } }
      ];
    }
    if (typeof isActive === 'boolean') query.isActive = isActive;
    if (typeof isEnabled === 'boolean') query.isEnabled = isEnabled;
    if (unitIds) {
      const ids = Array.isArray(unitIds) ? unitIds : [unitIds];
      if (!ids.every(id => mongoose.isValidObjectId(id))) return badId(res, 'unitIds');
      query.unitIds = { $in: ids };
    }

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: [{ path: 'unitIds', select: 'unitName unitCode' }]
    };

    const maintenanceModes = await MaintenanceMode.paginate(query, options);
    res.status(200).json({ success: true, statusCode: 200, message: 'Maintenance modes fetched successfully', data: maintenanceModes });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error fetching maintenance modes', error: error.message });
  }
};

const updateMaintenanceMode = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body || {};
    if (!_id) return res.status(400).json({ success: false, statusCode: 400, message: 'Maintenance mode ID is required' });
    if (!mongoose.isValidObjectId(_id)) return badId(res);

    const maintenanceMode = await MaintenanceMode.findByIdAndUpdate(_id, updateData, { new: true, runValidators: true });
    if (!maintenanceMode) return res.status(404).json({ success: false, statusCode: 404, message: 'Maintenance mode not found' });

    res.status(200).json({ success: true, statusCode: 200, message: 'Maintenance mode updated successfully', data: maintenanceMode });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error updating maintenance mode', error: error.message });
  }
};

const deleteMaintenanceMode = async (req, res) => {
  try {
    const { _id } = req.body || {};
    if (!_id) return res.status(400).json({ success: false, statusCode: 400, message: 'Maintenance mode ID is required' });
    if (!mongoose.isValidObjectId(_id)) return badId(res);

    const maintenanceMode = await MaintenanceMode.findByIdAndDelete(_id);
    if (!maintenanceMode) return res.status(404).json({ success: false, statusCode: 404, message: 'Maintenance mode not found' });

    res.status(200).json({ success: true, statusCode: 200, message: 'Maintenance mode deleted successfully', data: maintenanceMode });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error deleting maintenance mode', error: error.message });
  }
};

const toggleMaintenanceMode = async (req, res) => {
  try {
    const { _id, isEnabled, enabledBy } = req.body || {};
    if (!_id) return res.status(400).json({ success: false, statusCode: 400, message: 'Maintenance mode ID is required' });
    if (!mongoose.isValidObjectId(_id)) return badId(res);
    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({ success: false, statusCode: 400, message: 'isEnabled (boolean) is required' });
    }

    const updateData = { isEnabled };
    if (isEnabled) {
      updateData.startTime = new Date();
      if (enabledBy) updateData.enabledBy = enabledBy;
    } else {
      updateData.endTime = new Date();
    }

    const maintenanceMode = await MaintenanceMode.findByIdAndUpdate(_id, updateData, { new: true, runValidators: true });
    if (!maintenanceMode) return res.status(404).json({ success: false, statusCode: 404, message: 'Maintenance mode not found' });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Maintenance mode ${isEnabled ? 'enabled' : 'disabled'} successfully`,
      data: maintenanceMode
    });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error toggling maintenance mode', error: error.message });
  }
};

module.exports = {
  addMaintenanceMode,
  searchMaintenanceMode,
  updateMaintenanceMode,
  deleteMaintenanceMode,
  toggleMaintenanceMode
};
