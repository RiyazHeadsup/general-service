const Service = require('../models/Service');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

// Create Service
const addService = async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error creating service',
      error: error.message
    });
  }
};

// Search Services with pagination
const searchService = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = {},
      sort,
      populate
    } = req.body;

    const defaultPopulate = ['categoryId', 'subCategoryId', 'unitIds', 'staffIds', 'serviceParentId', 'productId', { path: 'inventoryId', select: 'qty stockIn stockOut status' }];
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sort || { createdAt: -1 },
      populate: populate || defaultPopulate
    };

    const services = await Service.paginate(search, options);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Services fetched successfully',
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error fetching services',
      error: error.message
    });
  }
};

// Update Service
const updateService = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Service ID is required'
      });
    }

    const service = await Service.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error updating service',
      error: error.message
    });
  }
};

// Delete Service
const deleteService = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Service ID is required'
      });
    }

    const service = await Service.findByIdAndDelete(_id);

    if (!service) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Service deleted successfully',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error deleting service',
      error: error.message
    });
  }
};

// Transfer Service to new Group
const transferService = async (req, res) => {
  try {
    const { serviceId, groupId } = req.body;

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Service ID is required'
      });
    }

    if (!groupId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Group ID is required'
      });
    }

    // Fetch the original service with category and subcategory
    const originalService = await Service.findById(serviceId)
      .populate('categoryId')
      .populate('subCategoryId');

    if (!originalService) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Service not found'
      });
    }

    const originalCategory = originalService.categoryId;
    const originalSubCategory = originalService.subCategoryId;

    if (!originalCategory || !originalSubCategory) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Service must have category and subcategory'
      });
    }

    // Check if service is already transferred to this group
    const existingTransferredService = await Service.findOne({
      serviceParentId: serviceId,
      isTransferred: true
    }).populate('categoryId');

    if (existingTransferredService && existingTransferredService.categoryId?.groupId?.toString() === groupId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Service is already transferred to this group'
      });
    }

    // Check if category already exists (transferred from same parent to same group)
    let targetCategory = await Category.findOne({
      groupId: groupId,
      categoryParentId: originalCategory._id,
      isTransferred: true
    });

    if (!targetCategory) {
      // Create new Category under the new group
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
    }

    // Check if subcategory already exists (transferred from same parent under that category)
    let targetSubCategory = await SubCategory.findOne({
      categoryId: targetCategory._id,
      subCategoryParentId: originalSubCategory._id,
      isTransferred: true
    });

    if (!targetSubCategory) {
      // Create new SubCategory under the category
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

      targetSubCategory = new SubCategory(newSubCategoryData);
      await targetSubCategory.save();
    }

    // Check if service already transferred under this subcategory
    const existingService = await Service.findOne({
      subCategoryId: targetSubCategory._id,
      serviceParentId: originalService._id,
      isTransferred: true
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Service is already transferred to this group'
      });
    }

    // Create new Service under the subcategory
    const newServiceData = {
      subCategoryId: targetSubCategory._id,
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
      variations: originalService.variations,
      steps: originalService.steps,
      incentive: originalService.incentive,
      isActive: originalService.isActive
    };

    const newService = new Service(newServiceData);
    await newService.save();

    // Update groupUsing array on original category, subcategory, and service
    await Category.findByIdAndUpdate(
      originalCategory._id,
      { $addToSet: { groupUsing: groupId } }
    );

    await SubCategory.findByIdAndUpdate(
      originalSubCategory._id,
      { $addToSet: { groupUsing: groupId } }
    );

    await Service.findByIdAndUpdate(
      originalService._id,
      { $addToSet: { groupUsing: groupId } }
    );

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Service transferred successfully',
      data: {
        category: targetCategory,
        subCategory: targetSubCategory,
        service: newService
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error transferring service',
      error: error.message
    });
  }
};

module.exports = {
  addService,
  searchService,
  updateService,
  deleteService,
  transferService
};
