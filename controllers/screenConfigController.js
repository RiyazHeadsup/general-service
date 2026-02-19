const ScreenConfig = require('../models/ScreenConfig');

// Create ScreenConfig
const addScreenConfig = async (req, res) => {
  try {
    const screenConfig = new ScreenConfig(req.body);
    await screenConfig.save();

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'ScreenConfig created successfully',
      data: screenConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error creating screenConfig',
      error: error.message
    });
  }
};

// Search ScreenConfigs with pagination
const searchScreenConfig = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = {},
      sortBy = 'createdAt',
      sortOrder = 'desc',
      populate
    } = req.body;

    const query = { ...search };

    const defaultPopulate = [{ path: 'projectId', select: 'name image status' }];

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: populate || defaultPopulate
    };

    const screenConfigs = await ScreenConfig.paginate(query, options);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'ScreenConfigs fetched successfully',
      data: screenConfigs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error fetching screenConfigs',
      error: error.message
    });
  }
};

// Update ScreenConfig
const updateScreenConfig = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'ScreenConfig ID is required'
      });
    }

    const screenConfig = await ScreenConfig.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!screenConfig) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'ScreenConfig not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'ScreenConfig updated successfully',
      data: screenConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error updating screenConfig',
      error: error.message
    });
  }
};

// Delete ScreenConfig
const deleteScreenConfig = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'ScreenConfig ID is required'
      });
    }

    const screenConfig = await ScreenConfig.findByIdAndDelete(_id);

    if (!screenConfig) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'ScreenConfig not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'ScreenConfig deleted successfully',
      data: screenConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error deleting screenConfig',
      error: error.message
    });
  }
};

module.exports = {
  addScreenConfig,
  searchScreenConfig,
  updateScreenConfig,
  deleteScreenConfig
};
