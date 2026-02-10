const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

// Product CRUD routes
router.post('/addProduct', productController.createProduct);
router.post('/searchProduct', productController.searchProduct);
router.post('/updateProduct', productController.updateProduct);
router.post('/deleteProduct', productController.deleteProduct);

module.exports = router;