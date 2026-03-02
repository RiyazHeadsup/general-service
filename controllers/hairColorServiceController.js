const HairColorService = require('../models/HairColorService');

// Create Hair Color Service
const addHairColorService = async (req, res) => {
  try {
    const hairColorService = new HairColorService(req.body);
    await hairColorService.save();

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Hair color service created successfully',
      data: hairColorService
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error creating hair color service',
      error: error.message
    });
  }
};

// Search Hair Color Services with pagination
const searchHairColorService = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      category,
      gender,
      unitIds,
      _id,
      populate
    } = req.body;

    const query = {};

    if (_id) {
      query._id = _id;
    }

    if (search) {
      query.$or = [
        { serviceName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'ratios.productName': { $regex: search, $options: 'i' } },
        { 'ratios.brand': { $regex: search, $options: 'i' } }
      ];
    }

    if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    }

    if (category) {
      query.category = category;
    }

    if (gender) {
      query.gender = gender;
    }

    if (unitIds) {
      query.unitIds = unitIds;
    }

    const defaultPopulate = ['unitIds', { path: 'ratios.productId', select: 'productName brand productImageUrl' }];
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: populate || defaultPopulate
    };

    const hairColorServices = await HairColorService.paginate(query, options);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Hair color services fetched successfully',
      data: hairColorServices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error fetching hair color services',
      error: error.message
    });
  }
};

// Update Hair Color Service
const updateHairColorService = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Hair color service ID is required'
      });
    }

    const hairColorService = await HairColorService.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!hairColorService) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Hair color service not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Hair color service updated successfully',
      data: hairColorService
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error updating hair color service',
      error: error.message
    });
  }
};

// Delete Hair Color Service
const deleteHairColorService = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Hair color service ID is required'
      });
    }

    const hairColorService = await HairColorService.findByIdAndDelete(_id);

    if (!hairColorService) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Hair color service not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Hair color service deleted successfully',
      data: hairColorService
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error deleting hair color service',
      error: error.message
    });
  }
};

module.exports = {
  addHairColorService,
  searchHairColorService,
  updateHairColorService,
  deleteHairColorService
};
