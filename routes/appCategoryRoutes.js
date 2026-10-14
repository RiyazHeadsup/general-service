const express = require('express');
const router = express.Router();
const {
  addAppCategory,
  searchAppCategory,
  updateAppCategory,
  deleteAppCategory
} = require('../controllers/appCategoryController');

router.post('/addAppCategory', addAppCategory);
router.post('/searchAppCategory', searchAppCategory);
router.post('/updateAppCategory', updateAppCategory);
router.post('/deleteAppCategory', deleteAppCategory);

module.exports = router;
