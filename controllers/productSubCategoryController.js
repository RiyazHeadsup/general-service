const ProductSubCategory = require('../models/ProductSubCategory');
const ProductCategory = require('../models/ProductCategory');
const ProductBrand = require('../models/ProductBrand');
const Product = require('../models/Product');

const addProductSubCategory = async (req, res) => {
  try {
    const productSubCategory = new ProductSubCategory(req.body);
    await productSubCategory.save();

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Product subcategory created successfully',
      data: productSubCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error creating product subcategory',
      error: error.message
    });
  }
};

const searchProductSubCategory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
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

    const productSubCategories = await ProductSubCategory.paginate(query, options);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Product subcategories fetched successfully',
      data: productSubCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error fetching product subcategories',
      error: error.message
    });
  }
};

const updateProductSubCategory = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product subcategory ID is required'
      });
    }

    const productSubCategory = await ProductSubCategory.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!productSubCategory) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Product subcategory not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Product subcategory updated successfully',
      data: productSubCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error updating product subcategory',
      error: error.message
    });
  }
};

const deleteProductSubCategory = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product subcategory ID is required'
      });
    }

    // Check for existing product brands
    const existingBrands = await ProductBrand.findOne({ productSubCategoryId: _id });
    if (existingBrands) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Cannot delete product subcategory. Product brands exist under this subcategory.'
      });
    }

    const productSubCategory = await ProductSubCategory.findByIdAndDelete(_id);

    if (!productSubCategory) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Product subcategory not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Product subcategory deleted successfully',
      data: productSubCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error deleting product subcategory',
      error: error.message
    });
  }
};

const transferProductSubCategory = async (req, res) => {
  try {
    const { productSubCategoryId, productGroupId } = req.body;

    if (!productSubCategoryId || !productGroupId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product subcategory ID and product group ID are required'
      });
    }

    // Fetch original subcategory
    const originalSubCategory = await ProductSubCategory.findById(productSubCategoryId);
    if (!originalSubCategory) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Product subcategory not found'
      });
    }

    // Check if already transferred to target group
    const existingSubCategory = await ProductSubCategory.findOne({
      productSubCategoryParentId: productSubCategoryId,
      productGroupId: productGroupId,
      isTransferred: true
    });

    if (existingSubCategory) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product subcategory is already transferred to this group'
      });
    }

    // Find or create parent category in target group
    const originalCategory = await ProductCategory.findById(originalSubCategory.productCategoryId);
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

    // Create new subcategory in target group
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

    const newSubCategory = new ProductSubCategory(newSubCategoryData);
    await newSubCategory.save();

    // Transfer brands under this subcategory
    const brands = await ProductBrand.find({
      productSubCategoryId: productSubCategoryId,
      isTransferred: { $ne: true }
    });

    for (const originalBrand of brands) {
      const newBrandData = {
        productSubCategoryId: newSubCategory._id,
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
        productBrandId: originalBrand._id,
        isTransferred: { $ne: true }
      });

      for (const originalProduct of products) {
        const newProductData = {
          ...originalProduct.toObject(),
          _id: undefined,
          productBrandId: newBrand._id,
          productSubCategoryId: newSubCategory._id,
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
    }

    // Update groupUsing on original subcategory
    await ProductSubCategory.findByIdAndUpdate(
      originalSubCategory._id,
      { $addToSet: { groupUsing: productGroupId } }
    );

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Product subcategory transferred successfully',
      data: newSubCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error transferring product subcategory',
      error: error.message
    });
  }
};

module.exports = {
  addProductSubCategory,
  searchProductSubCategory,
  updateProductSubCategory,
  deleteProductSubCategory,
  transferProductSubCategory
};
