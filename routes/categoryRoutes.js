const express = require('express');
const router = express.Router();
const {
  addCategory,
  searchCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

// CRUD Routes
router.post('/addCategory', addCategory);
router.post('/searchCategory', searchCategory);
router.post('/updateCategory', updateCategory);
router.post('/deleteCategory', deleteCategory);

module.exports = router;
