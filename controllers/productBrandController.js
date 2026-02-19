const ProductBrand = require('../models/ProductBrand');
const ProductSubCategory = require('../models/ProductSubCategory');
const ProductCategory = require('../models/ProductCategory');
const Product = require('../models/Product');

const addProductBrand = async (req, res) => {
  try {
    const productBrand = new ProductBrand(req.body);
    await productBrand.save();

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Product brand created successfully',
      data: productBrand
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error creating product brand',
      error: error.message
    });
  }
};

const searchProductBrand = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      productSubCategoryId,
      productCategoryId,
      productGroupId,
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

    if (productSubCategoryId) {
      query.productSubCategoryId = productSubCategoryId;
    }

    if (productCategoryId) {
      query.productCategoryId = productCategoryId;
    }

    if (productGroupId) {
      query.productGroupId = productGroupId;
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

    const productBrands = await ProductBrand.paginate(query, options);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Product brands fetched successfully',
      data: productBrands
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error fetching product brands',
      error: error.message
    });
  }
};

const updateProductBrand = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product brand ID is required'
      });
    }

    const productBrand = await ProductBrand.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!productBrand) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Product brand not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Product brand updated successfully',
      data: productBrand
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error updating product brand',
      error: error.message
    });
  }
};

const deleteProductBrand = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product brand ID is required'
      });
    }

    // Check for existing products
    const existingProducts = await Product.findOne({ productBrandId: _id });
    if (existingProducts) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Cannot delete product brand. Products exist under this brand.'
      });
    }

    const productBrand = await ProductBrand.findByIdAndDelete(_id);

    if (!productBrand) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Product brand not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Product brand deleted successfully',
      data: productBrand
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error deleting product brand',
      error: error.message
    });
  }
};

const transferProductBrand = async (req, res) => {
  try {
    const { productBrandId, productGroupId } = req.body;

    if (!productBrandId || !productGroupId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product brand ID and product group ID are required'
      });
    }

    // Fetch original brand
    const originalBrand = await ProductBrand.findById(productBrandId);
    if (!originalBrand) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Product brand not found'
      });
    }

    // Check if already transferred to target group
    const existingBrand = await ProductBrand.findOne({
      productBrandParentId: productBrandId,
      productGroupId: productGroupId,
      isTransferred: true
    });

    if (existingBrand) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product brand is already transferred to this group'
      });
    }

    // Find or create parent subcategory in target group
    const originalSubCategory = await ProductSubCategory.findById(originalBrand.productSubCategoryId);
    const originalCategory = await ProductCategory.findById(originalSubCategory.productCategoryId);

    // Find or create target category
    let targetCategory = await ProductCategory.findOne({
      productGroupId: productGroupId,
      productCategoryParentId: originalCategory._id,
      isTransferred: true
    });

    if (!targetCategory) {
      const newCategoryData = {
        productGroupId: productGroupId,
        productCategoryParentId: originalCategory._id,
        isTransferred: true,
        name: originalCategory.name,
        img: originalCategory.img,
        description: originalCategory.description,
        unitIds: originalCategory.unitIds,
        isActive: originalCategory.isActive
      };
      targetCategory = new ProductCategory(newCategoryData);
      await targetCategory.save();

      // Update groupUsing on original category
      await ProductCategory.findByIdAndUpdate(
        originalCategory._id,
        { $addToSet: { groupUsing: productGroupId } }
      );
    }

    // Find or create target subcategory
    let targetSubCategory = await ProductSubCategory.findOne({
      productGroupId: productGroupId,
      productSubCategoryParentId: originalSubCategory._id,
      isTransferred: true
    });

    if (!targetSubCategory) {
      const newSubCategoryData = {
        productCategoryId: targetCategory._id,
        productGroupId: productGroupId,
        productSubCategoryParentId: originalSubCategory._id,
        isTransferred: true,
        name: originalSubCategory.name,
        img: originalSubCategory.img,
        description: originalSubCategory.description,
        unitIds: originalSubCategory.unitIds,
        isActive: originalSubCategory.isActive
      };
      targetSubCategory = new ProductSubCategory(newSubCategoryData);
      await targetSubCategory.save();

      // Update groupUsing on original subcategory
      await ProductSubCategory.findByIdAndUpdate(
        originalSubCategory._id,
        { $addToSet: { groupUsing: productGroupId } }
      );
    }

    // Create new brand in target group
    const newBrandData = {
      productSubCategoryId: targetSubCategory._id,
      productCategoryId: targetCategory._id,
      productGroupId: productGroupId,
      productBrandParentId: originalBrand._id,
      isTransferred: true,
      name: originalBrand.name,
      img: originalBrand.img,
      description: originalBrand.description,
      unitIds: originalBrand.unitIds,
      isActive: originalBrand.isActive
    };

    const newBrand = new ProductBrand(newBrandData);
    await newBrand.save();

    // Transfer products under this brand
    const products = await Product.find({
      productBrandId: productBrandId,
      isTransferred: { $ne: true }
    });

    for (const originalProduct of products) {
      const newProductData = {
        ...originalProduct.toObject(),
        _id: undefined,
        productBrandId: newBrand._id,
        productSubCategoryId: targetSubCategory._id,
        productCategoryId: targetCategory._id,
        productGroupId: productGroupId,
        productParentId: originalProduct._id,
        isTransferred: true,
        createdAt: undefined,
        updatedAt: undefined
      };

      const newProduct = new Product(newProductData);
      await newProduct.save();

      // Update groupUsing on original product
      await Product.findByIdAndUpdate(
        originalProduct._id,
        { $addToSet: { groupUsing: productGroupId } }
      );
    }

    // Update groupUsing on original brand
    await ProductBrand.findByIdAndUpdate(
      originalBrand._id,
      { $addToSet: { groupUsing: productGroupId } }
    );

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Product brand transferred successfully',
      data: newBrand
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error transferring product brand',
      error: error.message
    });
  }
};

module.exports = {
  addProductBrand,
  searchProductBrand,
  updateProductBrand,
  deleteProductBrand,
  transferProductBrand
};
