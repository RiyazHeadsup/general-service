const express = require('express');
const orderController = require('../controllers/orderController');

const router = express.Router();

// Order CRUD routes
router.post('/addOrder', orderController.createOrder);
router.post('/searchOrder', orderController.searchOrder);
router.post('/updateOrder', orderController.updateOrder);
router.post('/deleteOrder', orderController.deleteOrder);

module.exports = router;