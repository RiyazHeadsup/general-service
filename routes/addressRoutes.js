const express = require('express');
const addressController = require('../controllers/addressController');

const router = express.Router();

router.post('/addAddress', addressController.addAddress);
router.post('/searchAddress', addressController.searchAddress);
router.post('/updateAddress', addressController.updateAddress);
router.post('/deleteAddress', addressController.deleteAddress);
router.post('/setActiveAddress', addressController.setActiveAddress);//

module.exports = router;
