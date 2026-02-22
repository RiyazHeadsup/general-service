const express = require('express');
const websiteSectionController = require('../controllers/websiteSectionController');

const router = express.Router();

// Admin CRUD
router.post('/addWebsiteSection', websiteSectionController.addWebsiteSection);
router.post('/searchWebsiteSection', websiteSectionController.searchWebsiteSection);
router.post('/updateWebsiteSection', websiteSectionController.updateWebsiteSection);
router.post('/deleteWebsiteSection', websiteSectionController.deleteWebsiteSection);

// Admin utilities
router.post('/toggleWebsiteSectionVisibility', websiteSectionController.toggleWebsiteSectionVisibility);
router.post('/reorderWebsiteSections', websiteSectionController.reorderWebsiteSections);
router.post('/seedDefaultWebsiteSections', websiteSectionController.seedDefaultSections);

module.exports = router;
