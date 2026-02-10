const express = require('express');
const router = express.Router();
const stockTransactionController = require('../controllers/stockTransactionController');

// Stock Transaction CRUD routes
router.post('/addStockTransaction', stockTransactionController.createStockTransaction);
router.post('/searchStockTransaction', stockTransactionController.searchStockTransaction);
router.post('/updateStockTransaction', stockTransactionController.updateStockTransaction);
router.post('/deleteStockTransaction', stockTransactionController.deleteStockTransaction);
router.post('/cancelStockTransaction', stockTransactionController.cancelStockTransaction);
router.post('/acceptStockTransaction', stockTransactionController.acceptStockTransaction);
router.post('/rejectStockTransaction', stockTransactionController.rejectStockTransaction);

module.exports = router;