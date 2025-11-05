const express = require('express');
const shelfInventoryController = require('../controllers/shelfInventoryController');

const router = express.Router();

// ShelfInventory CRUD routes
router.post('/addShelfInventory', shelfInventoryController.createShelfInventory);
router.post('/searchShelfInventory', shelfInventoryController.searchShelfInventory);
router.post('/updateShelfInventory', shelfInventoryController.updateShelfInventory);
router.post('/deleteShelfInventory', shelfInventoryController.deleteShelfInventory);

// Transfer routes
router.post('/transferFromWarehouseToShelf', shelfInventoryController.transferFromWarehouseToShelf);

module.exports = router;