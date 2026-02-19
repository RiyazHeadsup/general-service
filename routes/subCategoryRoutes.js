const express = require('express');
const router = express.Router();
const {
  addSubCategory,
  searchSubCategory,
  updateSubCategory,
  deleteSubCategory,
  transferSubCategory
} = require('../controllers/subCategoryController');

// CRUD Routes
router.post('/addSubCategory', addSubCategory);
router.post('/searchSubCategory', searchSubCategory);
router.post('/updateSubCategory', updateSubCategory);
router.post('/deleteSubCategory', deleteSubCategory);
router.post('/transferSubCategory', transferSubCategory);

module.exports = router;
