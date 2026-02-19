const express = require('express');
const router = express.Router();
const {
  addProductBrand,
  searchProductBrand,
  updateProductBrand,
  deleteProductBrand,
  transferProductBrand
} = require('../controllers/productBrandController');

router.post('/addProductBrand', addProductBrand);
router.post('/searchProductBrand', searchProductBrand);
router.post('/updateProductBrand', updateProductBrand);
router.post('/deleteProductBrand', deleteProductBrand);
router.post('/transferProductBrand', transferProductBrand);

module.exports = router;
