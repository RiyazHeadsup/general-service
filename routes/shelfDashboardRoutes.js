const express = require('express');
const shelfDashboardController = require('../controllers/shelfDashboardController');

const router = express.Router();

// ShelfDashboard CRUD routes
router.post('/addShelfDashboard', shelfDashboardController.createShelfDashboard);
router.post('/searchShelfDashboard', shelfDashboardController.searchShelfDashboard);
router.post('/updateShelfDashboard', shelfDashboardController.updateShelfDashboard);
router.post('/deleteShelfDashboard', shelfDashboardController.deleteShelfDashboard);

module.exports = router;