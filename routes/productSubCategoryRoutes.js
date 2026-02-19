const express = require('express');
const router = express.Router();
const {
  addProductSubCategory,
  searchProductSubCategory,
  updateProductSubCategory,
  deleteProductSubCategory,
  transferProductSubCategory
} = require('../controllers/productSubCategoryController');

router.post('/addProductSubCategory', addProductSubCategory);
router.post('/searchProductSubCategory', searchProductSubCategory);
router.post('/updateProductSubCategory', updateProductSubCategory);
router.post('/deleteProductSubCategory', deleteProductSubCategory);
router.post('/transferProductSubCategory', transferProductSubCategory);

module.exports = router;
