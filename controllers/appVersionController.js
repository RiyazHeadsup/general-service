const mongoose = require('mongoose');
const AppVersion = require('../models/AppVersion');

// Admin CRUD for customer app releases (`appversions`). The app's
// checkAppVersion stays public in the gateway, reading the same collection.

const badId = (res) => res.status(400).json({ success: false, statusCode: 400, message: 'Invalid _id' });

const addAppVersion = async (req, res) => {
  try {
    const appVersion = new AppVersion(req.body);
    await appVersion.save();
    res.status(201).json({ success: true, statusCode: 201, message: 'App version created successfully', data: appVersion });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error creating app version', error: error.message });
  }
};

const searchAppVersion = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'buildNumber',
      sortOrder = 'desc',
      platform,
      releaseType,
      isActive
    } = req.body || {};

    const query = {};
    if (platform && typeof platform === 'string') query.platform = platform;
    if (releaseType && typeof releaseType === 'string') query.releaseType = releaseType;
    if (typeof isActive === 'boolean') query.isActive = isActive;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    const result = await AppVersion.paginate(query, options);
    res.status(200).json({ success: true, statusCode: 200, message: 'App versions fetched successfully', data: result });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error fetching app versions', error: error.message });
  }
};

const updateAppVersion = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body || {};
    if (!_id) return res.status(400).json({ success: false, statusCode: 400, message: '_id is required' });
    if (!mongoose.isValidObjectId(_id)) return badId(res);

    const appVersion = await AppVersion.findByIdAndUpdate(_id, updateData, { new: true, runValidators: true });
    if (!appVersion) return res.status(404).json({ success: false, statusCode: 404, message: 'App version not found' });

    res.status(200).json({ success: true, statusCode: 200, message: 'App version updated successfully', data: appVersion });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error updating app version', error: error.message });
  }
};

const deleteAppVersion = async (req, res) => {
  try {
    const { _id } = req.body || {};
    if (!_id) return res.status(400).json({ success: false, statusCode: 400, message: '_id is required' });
    if (!mongoose.isValidObjectId(_id)) return badId(res);

    const appVersion = await AppVersion.findByIdAndDelete(_id);
    if (!appVersion) return res.status(404).json({ success: false, statusCode: 404, message: 'App version not found' });

    res.status(200).json({ success: true, statusCode: 200, message: 'App version deleted successfully', data: appVersion });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error deleting app version', error: error.message });
  }
};

module.exports = { addAppVersion, searchAppVersion, updateAppVersion, deleteAppVersion };
