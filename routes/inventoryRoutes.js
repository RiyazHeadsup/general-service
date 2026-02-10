const express = require('express');
const inventoryController = require('../controllers/inventoryController');

const router = express.Router();

// Inventory CRUD routes
router.post('/addInventory', inventoryController.createInventory);
router.post('/searchInventory', inventoryController.searchInventory);
router.post('/updateInventory', inventoryController.updateInventory);
router.post('/deleteInventory', inventoryController.deleteInventory);

module.exports = router;