const ProductCategory = require('../models/ProductCategory');
const ProductSubCategory = require('../models/ProductSubCategory');
const ProductBrand = require('../models/ProductBrand');
const Product = require('../models/Product');

const addProductCategory = async (req, res) => {
  try {
    const productCategory = new ProductCategory(req.body);
    await productCategory.save();

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Product category created successfully',
      data: productCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error creating product category',
      error: error.message
    });
  }
};

const searchProductCategory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
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

    const productCategories = await ProductCategory.paginate(query, options);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Product categories fetched successfully',
      data: productCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error fetching product categories',
      error: error.message
    });
  }
};

const updateProductCategory = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product category ID is required'
      });
    }

    const productCategory = await ProductCategory.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!productCategory) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Product category not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Product category updated successfully',
      data: productCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error updating product category',
      error: error.message
    });
  }
};

const deleteProductCategory = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product category ID is required'
      });
    }

    // Check for existing product subcategories
    const existingSubCategories = await ProductSubCategory.findOne({ productCategoryId: _id });
    if (existingSubCategories) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Cannot delete product category. Product subcategories exist under this category.'
      });
    }

    const productCategory = await ProductCategory.findByIdAndDelete(_id);

    if (!productCategory) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Product category not found'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Product category deleted successfully',
      data: productCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error deleting product category',
      error: error.message
    });
  }
};

const transferProductCategory = async (req, res) => {
  try {
    const { productCategoryId, productGroupId } = req.body;

    if (!productCategoryId || !productGroupId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product category ID and product group ID are required'
      });
    }

    // Fetch original category
    const originalCategory = await ProductCategory.findById(productCategoryId);
    if (!originalCategory) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Product category not found'
      });
    }

    // Check if already transferred to target group
    const existingCategory = await ProductCategory.findOne({
      productCategoryParentId: productCategoryId,
      productGroupId: productGroupId,
      isTransferred: true
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Product category is already transferred to this group'
      });
    }

    // Create new category in target group
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

    const newCategory = new ProductCategory(newCategoryData);
    await newCategory.save();

    // Transfer subcategories
    const subCategories = await ProductSubCategory.find({
      productCategoryId: productCategoryId,
      isTransferred: { $ne: true }
    });

    for (const originalSubCategory of subCategories) {
      const newSubCategoryData = {
        productCategoryId: newCategory._id,
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
        productSubCategoryId: originalSubCategory._id,
        isTransferred: { $ne: true }
      });

      for (const originalBrand of brands) {
        const newBrandData = {
          productSubCategoryId: newSubCategory._id,
          productCategoryId: newCategory._id,
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
            productCategoryId: newCategory._id,
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
    }

    // Update groupUsing on original category
    await ProductCategory.findByIdAndUpdate(
      originalCategory._id,
      { $addToSet: { groupUsing: productGroupId } }
    );

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Product category transferred successfully',
      data: newCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error transferring product category',
      error: error.message
    });
  }
};

module.exports = {
  addProductCategory,
  searchProductCategory,
  updateProductCategory,
  deleteProductCategory,
  transferProductCategory
};
