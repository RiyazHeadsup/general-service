const SubCategory = require('../models/SubCategory');
const Category = require('../models/Category');
const Service = require('../models/Service');

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

// Transfer SubCategory to new Group
const transferSubCategory = async (req, res) => {
  try {
    const { subCategoryId, groupId } = req.body;

    if (!subCategoryId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'SubCategory ID is required'
      });
    }

    if (!groupId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Group ID is required'
      });
    }

    // Fetch the original subcategory with category
    const originalSubCategory = await SubCategory.findById(subCategoryId).populate('categoryId');

    if (!originalSubCategory) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'SubCategory not found'
      });
    }

    const originalCategory = originalSubCategory.categoryId;

    if (!originalCategory) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'SubCategory must have a category'
      });
    }

    // Check if subcategory is already transferred to this group
    const existingSubCategory = await SubCategory.findOne({
      subCategoryParentId: subCategoryId,
      isTransferred: true
    }).populate('categoryId');

    if (existingSubCategory && existingSubCategory.categoryId?.groupId?.toString() === groupId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'SubCategory is already transferred to this group'
      });
    }

    // Check if category already exists in target group (transferred from same parent)
    let targetCategory = await Category.findOne({
      groupId: groupId,
      categoryParentId: originalCategory._id,
      isTransferred: true
    });

    if (!targetCategory) {
      // Create new Category in target group
      const newCategoryData = {
        groupId: groupId,
        categoryParentId: originalCategory._id,
        isTransferred: true,
        name: originalCategory.name,
        img: originalCategory.img,
        description: originalCategory.description,
        gender: originalCategory.gender,
        serviceFor: originalCategory.serviceFor,
        serviceType: originalCategory.serviceType,
        unitIds: originalCategory.unitIds,
        isActive: originalCategory.isActive
      };

      targetCategory = new Category(newCategoryData);
      await targetCategory.save();

      // Update groupUsing on original category
      await Category.findByIdAndUpdate(
        originalCategory._id,
        { $addToSet: { groupUsing: groupId } }
      );
    }

    // Create new SubCategory in target group
    const newSubCategoryData = {
      categoryId: targetCategory._id,
      groupId: groupId,
      subCategoryParentId: originalSubCategory._id,
      isTransferred: true,
      name: originalSubCategory.name,
      img: originalSubCategory.img,
      description: originalSubCategory.description,
      gender: originalSubCategory.gender,
      serviceFor: originalSubCategory.serviceFor,
      serviceType: originalSubCategory.serviceType,
      unitIds: originalSubCategory.unitIds,
      isActive: originalSubCategory.isActive
    };

    const newSubCategory = new SubCategory(newSubCategoryData);
    await newSubCategory.save();

    // Find all services under this subcategory and transfer them
    const services = await Service.find({ subCategoryId: subCategoryId, isTransferred: { $ne: true } });

    for (const originalService of services) {
      // Create new Service
      const newServiceData = {
        subCategoryId: newSubCategory._id,
        categoryId: targetCategory._id,
        groupId: groupId,
        serviceParentId: originalService._id,
        isTransferred: true,
        staffIds: originalService.staffIds,
        unitIds: originalService.unitIds,
        name: originalService.name,
        service_time: originalService.service_time,
        price: originalService.price,
        member_price: originalService.member_price,
        img: originalService.img,
        description: originalService.description,
        gender: originalService.gender,
        serviceFor: originalService.serviceFor,
        serviceType: originalService.serviceType,
        isProductRequired: originalService.isProductRequired,
        productId: originalService.productId,
        inventoryId: originalService.inventoryId,
        productQty: originalService.productQty,
        reduceInventoryOnBilling: originalService.reduceInventoryOnBilling,
        isMultiSession: originalService.isMultiSession,
        numberOfSessions: originalService.numberOfSessions,
        variations: originalService.variations,
        steps: originalService.steps,
        incentive: originalService.incentive,
        isActive: originalService.isActive
      };

      const newService = new Service(newServiceData);
      await newService.save();

      // Update groupUsing on original service
      await Service.findByIdAndUpdate(
        originalService._id,
        { $addToSet: { groupUsing: groupId } }
      );
    }

    // Update groupUsing on original subcategory
    await SubCategory.findByIdAndUpdate(
      originalSubCategory._id,
      { $addToSet: { groupUsing: groupId } }
    );

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'SubCategory transferred successfully',
      data: {
        category: targetCategory,
        subCategory: newSubCategory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error transferring subCategory',
      error: error.message
    });
  }
};

module.exports = {
  addSubCategory,
  searchSubCategory,
  updateSubCategory,
  deleteSubCategory,
  transferSubCategory
};
