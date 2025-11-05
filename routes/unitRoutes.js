const express = require('express');
const unitController = require('../controllers/unitController');

const router = express.Router();

// Health check
router.get('/health', unitController.getHealth);

// Unit CRUD routes
router.post('/addUnit', unitController.createUnit);
router.post('/searchUnit', unitController.searchUnit);
router.post('/updateUnit', unitController.updateUnit);
router.post('/deleteUnit', unitController.deleteUnit);

// Additional routes
router.get('/getAllUnits', unitController.getAllUnits);
router.get('/getUnit/:id', unitController.getUnitById);

module.exports = router;