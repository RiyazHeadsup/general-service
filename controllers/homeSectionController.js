const mongoose = require('mongoose');
const HomeSection = require('../models/HomeSection');
// Registered for populate
require('../models/AppCategory');
require('../models/Service');
require('../models/Category');
require('../models/SubCategory');

// Admin CRUD for the customer app's home-screen sections. The gateway serves
// the public read (searchHomeSection) from the same `homesections` collection.

const badId = (res, field = 'home section ID') =>
  res.status(400).json({ success: false, statusCode: 400, message: `Invalid ${field}` });

// Display fields only — never staffIds or anything user-linked.
const SERVICE_FIELDS = 'name img price service_time gender includeInSubscription';
const SECTION_POPULATE = [
  { path: 'appCategoryId', select: 'name icon' },
  { path: 'services.serviceId', select: SERVICE_FIELDS },
  { path: 'categories.categoryId', select: 'name img gender' },
  { path: 'categories.subCategoryId', select: 'name img gender' },
  { path: 'packages.services.serviceId', select: SERVICE_FIELDS }
];

const addHomeSection = async (req, res) => {
  try {
    const section = new HomeSection(req.body);
    await section.save();
    res.status(201).json({ success: true, statusCode: 201, message: 'Home section created successfully', data: section });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error creating home section', error: error.message });
  }
};

const searchHomeSection = async (req, res) => {
  try {
    const {
      _id,
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'order',
      sortOrder = 'asc',
      appCategoryId,
      unitId,
      sectionType,
      displayType,
      isActive
    } = req.body || {};

    const query = {};
    if (_id) {
      if (!mongoose.isValidObjectId(_id)) return badId(res);
      query._id = _id;
    }
    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } }
      ];
    }
    if (appCategoryId) {
      if (!mongoose.isValidObjectId(appCategoryId)) return badId(res, 'appCategoryId');
      query.appCategoryId = appCategoryId;
    }
    if (unitId) {
      if (!mongoose.isValidObjectId(unitId)) return badId(res, 'unitId');
      query.unitId = unitId;
    }
    if (sectionType && typeof sectionType === 'string') query.sectionType = sectionType;
    if (displayType && typeof displayType === 'string') query.displayType = displayType;
    if (typeof isActive === 'boolean') query.isActive = isActive;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: SECTION_POPULATE
    };

    const sections = await HomeSection.paginate(query, options);
    res.status(200).json({ success: true, statusCode: 200, message: 'Home sections fetched successfully', data: sections });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error fetching home sections', error: error.message });
  }
};

const updateHomeSection = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body || {};
    if (!_id) return res.status(400).json({ success: false, statusCode: 400, message: 'Home section ID is required' });
    if (!mongoose.isValidObjectId(_id)) return badId(res);

    const section = await HomeSection.findByIdAndUpdate(_id, updateData, { new: true, runValidators: true });
    if (!section) return res.status(404).json({ success: false, statusCode: 404, message: 'Home section not found' });

    res.status(200).json({ success: true, statusCode: 200, message: 'Home section updated successfully', data: section });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error updating home section', error: error.message });
  }
};

const deleteHomeSection = async (req, res) => {
  try {
    const { _id } = req.body || {};
    if (!_id) return res.status(400).json({ success: false, statusCode: 400, message: 'Home section ID is required' });
    if (!mongoose.isValidObjectId(_id)) return badId(res);

    const section = await HomeSection.findByIdAndDelete(_id);
    if (!section) return res.status(404).json({ success: false, statusCode: 404, message: 'Home section not found' });

    res.status(200).json({ success: true, statusCode: 200, message: 'Home section deleted successfully', data: section });
  } catch (error) {
    res.status(500).json({ success: false, statusCode: 500, message: 'Error deleting home section', error: error.message });
  }
};

module.exports = { addHomeSection, searchHomeSection, updateHomeSection, deleteHomeSection };
