const express = require('express');
const inventoryTransactionController = require('../controllers/inventoryTransactionController');

const router = express.Router();

// Inventory Transaction CRUD routes
router.post('/addInventoryTransaction', inventoryTransactionController.addInventoryTransaction);
router.post('/searchInventoryTransaction', inventoryTransactionController.searchInventoryTransaction);
router.post('/updateInventoryTransaction', inventoryTransactionController.updateInventoryTransaction);
router.post('/deleteInventoryTransaction', inventoryTransactionController.deleteInventoryTransaction);

module.exports = router;
