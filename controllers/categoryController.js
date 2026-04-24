const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Service = require('../models/Service');

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
      const mongoose = require('mongoose');
      const ids = Array.isArray(unitIds) ? unitIds : [unitIds];
      // Match both ObjectId and string formats
      const allIds = ids.flatMap(id => { try { return [new mongoose.Types.ObjectId(id), id] } catch { return [id] } });
      query.unitIds = { $in: allIds };
    }

    if (groupId) {
      // Match categories by groupId or groupUsing (imported categories use groupUsing)
      const groupCondition = { $or: [{ groupId: groupId }, { groupUsing: groupId }] };
      if (query.$or) {
        // Combine with existing $or (text search) using $and
        query.$and = [{ $or: query.$or }, groupCondition];
        delete query.$or;
      } else {
        Object.assign(query, groupCondition);
      }
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

// Transfer Category to new Group
const transferCategory = async (req, res) => {
  try {
    const { categoryId, groupId } = req.body;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Category ID is required'
      });
    }

    if (!groupId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Group ID is required'
      });
    }

    // Fetch the original category
    const originalCategory = await Category.findById(categoryId);

    if (!originalCategory) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Category not found'
      });
    }

    // Check if category is already transferred to this group
    const existingCategory = await Category.findOne({
      categoryParentId: categoryId,
      groupId: groupId,
      isTransferred: true
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Category is already transferred to this group'
      });
    }

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

    const newCategory = new Category(newCategoryData);
    await newCategory.save();

    // Find all subcategories under this category
    const subCategories = await SubCategory.find({ categoryId: categoryId, isTransferred: { $ne: true } });

    for (const originalSubCategory of subCategories) {
      // Create new SubCategory
      const newSubCategoryData = {
        categoryId: newCategory._id,
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

      // Find all services under this subcategory
      const services = await Service.find({ subCategoryId: originalSubCategory._id, isTransferred: { $ne: true } });

      for (const originalService of services) {
        // Create new Service
        const newServiceData = {
          subCategoryId: newSubCategory._id,
          categoryId: newCategory._id,
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
    }

    // Update groupUsing on original category
    await Category.findByIdAndUpdate(
      originalCategory._id,
      { $addToSet: { groupUsing: groupId } }
    );

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Category transferred successfully',
      data: newCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error transferring category',
      error: error.message
    });
  }
};

module.exports = {
  addCategory,
  searchCategory,
  updateCategory,
  deleteCategory,
  transferCategory
};
