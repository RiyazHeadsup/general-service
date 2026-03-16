const express = require('express');
const appBannerController = require('../controllers/appBannerController');

const router = express.Router();

// App Banner Admin CRUD routesddd
router.post('/addAppBanner', appBannerController.addAppBanner);
router.post('/searchAppBanner', appBannerController.searchAppBanner);
router.post('/updateAppBanner', appBannerController.updateAppBanner);
router.post('/deleteAppBanner', appBannerController.deleteAppBanner);//

module.exports = router;
