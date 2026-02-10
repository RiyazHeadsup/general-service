const express = require('express');
const productTransactionController = require('../controllers/productTransactionController');

const router = express.Router();

// ProductTransaction CRUD routes
router.post('/addProductTransaction', productTransactionController.createProductTransaction);
router.post('/searchProductTransaction', productTransactionController.searchProductTransaction);
router.post('/updateProductTransaction', productTransactionController.updateProductTransaction);
router.post('/deleteProductTransaction', productTransactionController.deleteProductTransaction);

module.exports = router;