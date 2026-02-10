const express = require('express');
const appController = require('../controllers/appController');
const appSectionClientController = require('../controllers/appSectionClientController');

const router = express.Router();

// App API routes (mobile app - read only)
router.post('/config', appController.getAppConfig);
router.post('/home', appController.getHome);
router.post('/parent-service', appController.getParentServiceDetails);
router.post('/banners', appController.getAppBanners);
router.post('/sections', appSectionClientController.getClientSections);

module.exports = router;
