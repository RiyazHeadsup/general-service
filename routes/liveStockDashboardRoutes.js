const express = require('express');
const liveStockDashboardController = require('../controllers/liveStockDashboardController');

const router = express.Router();

// LiveStockDashboard CRUD routes
router.post('/addLiveStockDashboard', liveStockDashboardController.createLiveStockDashboard);
router.post('/searchLiveStockDashboard', liveStockDashboardController.searchLiveStockDashboard);
router.post('/updateLiveStockDashboard', liveStockDashboardController.updateLiveStockDashboard);
router.post('/deleteLiveStockDashboard', liveStockDashboardController.deleteLiveStockDashboard);

module.exports = router;