const express = require('express');
const vendorController = require('../controllers/vendorController');

const router = express.Router();

// Vendor CRUD routes
router.post('/addVendor', vendorController.createVendor);
router.post('/searchVendor', vendorController.searchVendor);
router.post('/updateVendor', vendorController.updateVendor);
router.post('/deleteVendor', vendorController.deleteVendor);

module.exports = router;