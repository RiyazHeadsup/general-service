const ProductGroup = require('../models/ProductGroup');
const ProductCategory = require('../models/ProductCategory');

const addProductGroup = async (req, res) => {
  try {
    const productGroup = new ProductGroup(req.body);
    await productGroup.save();

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Product group created successfully',
      data: productGroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error creating product group',
      error: error.message
    });
  }
};

const searchProductGroup = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'displayOrder',
      sortOrder = 'asc',
      isActive,
      unitIds,
      populate = []
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

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    if (populate && populate.length > 0) {
      options.populate = populate;
    }

    const productGroups = await ProductGroup.paginate(query, options);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Product groups fetched successfully',
      data: productGroups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error fetching product groups',
      error: error.message
    });
  }
};

const updateProductGroup = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product group ID is required'
      });
    }

    const productGroup = await ProductGroup.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!productGroup) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Product group not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Product group updated successfully',
      data: productGroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error updating product group',
      error: error.message
    });
  }
};

const deleteProductGroup = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product group ID is required'
      });
    }

    // Check for existing product categories
    const existingCategories = await ProductCategory.findOne({ productGroupId: _id });
    if (existingCategories) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Cannot delete product group. Product categories exist under this group.'
      });
    }

    const productGroup = await ProductGroup.findByIdAndDelete(_id);

    if (!productGroup) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Product group not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Product group deleted successfully',
      data: productGroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error deleting product group',
      error: error.message
    });
  }
};

module.exports = {
  addProductGroup,
  searchProductGroup,
  updateProductGroup,
  deleteProductGroup
};
