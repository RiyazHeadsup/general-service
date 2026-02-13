const express = require('express');
const paymentMethodController = require('../controllers/paymentMethodController');

const router = express.Router();

router.post('/addPaymentMethod', paymentMethodController.addPaymentMethod);
router.post('/searchPaymentMethod', paymentMethodController.searchPaymentMethod);
router.post('/updatePaymentMethod', paymentMethodController.updatePaymentMethod);
router.post('/deletePaymentMethod', paymentMethodController.deletePaymentMethod);

module.exports = router;