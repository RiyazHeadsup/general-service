const express = require('express');
const router = express.Router();
const {
  addProductCategory,
  searchProductCategory,
  updateProductCategory,
  deleteProductCategory,
  transferProductCategory
} = require('../controllers/productCategoryController');

router.post('/addProductCategory', addProductCategory);
router.post('/searchProductCategory', searchProductCategory);
router.post('/updateProductCategory', updateProductCategory);
router.post('/deleteProductCategory', deleteProductCategory);
router.post('/transferProductCategory', transferProductCategory);

module.exports = router;
