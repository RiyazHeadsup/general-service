const mongoose = require('mongoose');
const AppCategory = require('../models/AppCategory');

// Admin CRUD for the customer app's top-level categories. The gateway serves
// the public read (searchAppCategory) from the same `appcategories` collection.

const badId = (res) => res.status(400).json({ success: false, statusCode: 400, message: 'Invalid app category ID' });

const addAppCategory = async (req, res) => {
  try {
    const category = new AppCategory(req.body);
    await category.save();
    res.status(201).json({ success: true, statusCode: 201, message: 'App category created successfully', data: category });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error creating app category', error: error.message });
  }
};

const searchAppCategory = async (req, res) => {
  try {
    const {
      _id,
      id,
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'sortOrder',
      sortOrder = 'asc',
      isActive
    } = req.body || {};

    const query = {};
    const filterId = _id || id;
    if (filterId) {
      if (!mongoose.isValidObjectId(filterId)) return badId(res);
      query._id = filterId;
    }
    if (search && typeof search === 'string') query.$or = [{ name: { $regex: search, $options: 'i' } }];
    if (typeof isActive === 'boolean') query.isActive = isActive;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    const categories = await AppCategory.paginate(query, options);
    res.status(200).json({ success: true, statusCode: 200, message: 'App categories fetched successfully', data: categories });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error fetching app categories', error: error.message });
  }
};

const updateAppCategory = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body || {};
    if (!_id) return res.status(400).json({ success: false, statusCode: 400, message: 'App category ID is required' });
    if (!mongoose.isValidObjectId(_id)) return badId(res);

    const category = await AppCategory.findByIdAndUpdate(_id, updateData, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, statusCode: 404, message: 'App category not found' });

    res.status(200).json({ success: true, statusCode: 200, message: 'App category updated successfully', data: category });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error updating app category', error: error.message });
  }
};

const deleteAppCategory = async (req, res) => {
  try {
    const { _id } = req.body || {};
    if (!_id) return res.status(400).json({ success: false, statusCode: 400, message: 'App category ID is required' });
    if (!mongoose.isValidObjectId(_id)) return badId(res);

    const category = await AppCategory.findByIdAndDelete(_id);
    if (!category) return res.status(404).json({ success: false, statusCode: 404, message: 'App category not found' });

    res.status(200).json({ success: true, statusCode: 200, message: 'App category deleted successfully', data: category });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error deleting app category', error: error.message });
  }
};

module.exports = { addAppCategory, searchAppCategory, updateAppCategory, deleteAppCategory };
