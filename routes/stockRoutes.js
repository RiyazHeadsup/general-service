const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

// Stock CRUD routes
router.post('/addStock', stockController.createStock);
router.post('/searchStock', stockController.searchStock);
router.post('/updateStock', stockController.updateStock);
router.post('/deleteStock', stockController.deleteStock);

module.exports = router;