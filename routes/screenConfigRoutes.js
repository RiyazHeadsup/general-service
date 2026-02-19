const express = require('express');
const router = express.Router();
const {
  addScreenConfig,
  searchScreenConfig,
  updateScreenConfig,
  deleteScreenConfig
} = require('../controllers/screenConfigController');

// CRUD Routes
router.post('/addScreenConfig', addScreenConfig);
router.post('/searchScreenConfig', searchScreenConfig);
router.post('/updateScreenConfig', updateScreenConfig);
router.post('/deleteScreenConfig', deleteScreenConfig);

module.exports = router;
