const express = require('express');
const websiteConfigController = require('../controllers/websiteConfigController');

const router = express.Router();

// Admin routes
router.post('/getWebsiteConfig', websiteConfigController.getWebsiteConfig);
router.post('/updateWebsiteConfig', websiteConfigController.updateWebsiteConfig);

// Public route — used by landing page (no auth needed)
router.post('/getWebsiteData', websiteConfigController.getWebsiteData);

module.exports = router;
