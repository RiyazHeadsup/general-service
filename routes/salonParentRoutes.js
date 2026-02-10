const express = require('express');
const salonParentController = require('../controllers/salonParentController');

const router = express.Router();

// SalonParent CRUD routes
router.post('/addSalonParent', salonParentController.createSalonParent);
router.post('/searchSalonParent', salonParentController.searchSalonParent);
router.post('/updateSalonParent', salonParentController.updateSalonParent);
router.post('/deleteSalonParent', salonParentController.deleteSalonParent);

module.exports = router;
