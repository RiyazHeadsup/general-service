const express = require('express');
const appSectionClientController = require('../controllers/appSectionClientController');

const router = express.Router();

// Admin CRUD routes
router.post('/addAppSectionClient', appSectionClientController.addAppSectionClient);
router.post('/searchAppSectionClient', appSectionClientController.searchAppSectionClient);
router.post('/updateAppSectionClient', appSectionClientController.updateAppSectionClient);
router.post('/deleteAppSectionClient', appSectionClientController.deleteAppSectionClient);

// Service management within sections
router.post('/addServiceToSection', appSectionClientController.addServiceToSection);
router.post('/removeServiceFromSection', appSectionClientController.removeServiceFromSection);
router.post('/reorderSectionServices', appSectionClientController.reorderSectionServices);

// Category management within sections
router.post('/addCategoryToSection', appSectionClientController.addCategoryToSection);
router.post('/removeCategoryFromSection', appSectionClientController.removeCategoryFromSection);

// Section ordering and visibility
router.post('/reorderSections', appSectionClientController.reorderSections);
router.post('/toggleSectionVisibility', appSectionClientController.toggleSectionVisibility);

module.exports = router;
