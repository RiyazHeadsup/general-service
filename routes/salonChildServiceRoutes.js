const express = require('express');
const salonChildServiceController = require('../controllers/salonChildServiceController');

const router = express.Router();

// SalonChildService CRUD routes
router.post('/addSalonChild', salonChildServiceController.createSalonChildService);
router.post('/searchSalonChild', salonChildServiceController.searchSalonChildService);
router.post('/updateSalonChild', salonChildServiceController.updateSalonChildService);
router.post('/deleteSalonChild', salonChildServiceController.deleteSalonChildService);

module.exports = router;
