const express = require('express');
const warehouseController = require('../controllers/warehouseController');

const router = express.Router();

// Warehouse CRUD routes
router.post('/addWarehouse', warehouseController.createWarehouse);
router.post('/searchWarehouse', warehouseController.searchWarehouse);
router.post('/updateWarehouse', warehouseController.updateWarehouse);
router.post('/deleteWarehouse', warehouseController.deleteWarehouse);
router.post('/addProductInWarehouse', warehouseController.addProductInWarehouse);

module.exports = router;