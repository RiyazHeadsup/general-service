const SubCategory = require('../models/SubCategory');

// Create SubCategory
const addSubCategory = async (req, res) => {
  try {
    const subCategory = new SubCategory(req.body);
    await subCategory.save();

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'SubCategory created successfully',
      data: subCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error creating subCategory',
      error: error.message
    });
  }
};

// Search SubCategories with pagination
const searchSubCategory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      categoryId,
      unitIds,
      groupId,
      populate
    } = req.body;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (unitIds) {
      query.unitIds = { $in: Array.isArray(unitIds) ? unitIds : [unitIds] };
    }

    if (groupId) {
      query.groupId = groupId;
    }

    const defaultPopulate = ['categoryId', 'unitIds', { path: 'groupUsing', select: 'name' }];
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: populate || defaultPopulate
    };

    const subCategories = await SubCategory.paginate(query, options);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'SubCategories fetched successfully',
      data: subCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error fetching subCategories',
      error: error.message
    });
  }
};

// Update SubCategory
const updateSubCategory = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'SubCategory ID is required'
      });
    }

    const subCategory = await SubCategory.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'SubCategory not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'SubCategory updated successfully',
      data: subCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error updating subCategory',
      error: error.message
    });
  }
};

// Delete SubCategory
const deleteSubCategory = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'SubCategory ID is required'
      });
    }

    const subCategory = await SubCategory.findByIdAndDelete(_id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'SubCategory not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'SubCategory deleted successfully',
      data: subCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error deleting subCategory',
      error: error.message
    });
  }
};

module.exports = {
  addSubCategory,
  searchSubCategory,
  updateSubCategory,
  deleteSubCategory
};
