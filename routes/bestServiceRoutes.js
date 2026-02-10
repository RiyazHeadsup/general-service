const express = require('express');
const bestServiceController = require('../controllers/bestServiceController');

const router = express.Router();

// BestService CRUD routes
router.post('/addBestService', bestServiceController.createBestService);
router.post('/searchBestService', bestServiceController.searchBestService);
router.post('/updateBestService', bestServiceController.updateBestService);
router.post('/deleteBestService', bestServiceController.deleteBestService);

module.exports = router;
