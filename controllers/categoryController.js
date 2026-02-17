const Category = require('../models/Category');

// Create Category
const addCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error creating category',
      error: error.message
    });
  }
};

// Search Categories with pagination
const searchCategory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
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

    if (unitIds) {
      query.unitIds = { $in: Array.isArray(unitIds) ? unitIds : [unitIds] };
    }

    if (groupId) {
      query.groupId = groupId;
    }

    const defaultPopulate = ['unitIds', { path: 'groupId', select: 'name img' }, { path: 'groupUsing', select: 'name' }];
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: populate || defaultPopulate
    };

    const categories = await Category.paginate(query, options);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Categories fetched successfully',
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// Update Category
const updateCategory = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Category ID is required'
      });
    }

    const category = await Category.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error updating category',
      error: error.message
    });
  }
};

// Delete Category
const deleteCategory = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Category ID is required'
      });
    }

    const category = await Category.findByIdAndDelete(_id);

    if (!category) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Category deleted successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

module.exports = {
  addCategory,
  searchCategory,
  updateCategory,
  deleteCategory
};
