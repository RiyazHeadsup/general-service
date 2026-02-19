const express = require('express');
const router = express.Router();
const {
  addProductGroup,
  searchProductGroup,
  updateProductGroup,
  deleteProductGroup
} = require('../controllers/productGroupController');

router.post('/addProductGroup', addProductGroup);
router.post('/searchProductGroup', searchProductGroup);
router.post('/updateProductGroup', updateProductGroup);
router.post('/deleteProductGroup', deleteProductGroup);

module.exports = router;
