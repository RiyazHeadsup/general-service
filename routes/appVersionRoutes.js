const express = require('express');
const router = express.Router();
const {
  addAppVersion,
  searchAppVersion,
  updateAppVersion,
  deleteAppVersion
} = require('../controllers/appVersionController');

// Admin only — checkAppVersion is served publicly by the gateway
router.post('/addAppVersion', addAppVersion);
router.post('/searchAppVersion', searchAppVersion);
router.post('/updateAppVersion', updateAppVersion);
router.post('/deleteAppVersion', deleteAppVersion);

module.exports = router;
