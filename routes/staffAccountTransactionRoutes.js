const express = require('express');
const controller = require('../controllers/staffAccountTransactionController');

const router = express.Router();

router.post('/addStaffTransaction', controller.addTransaction.bind(controller));
router.post('/searchStaffTransaction', controller.searchTransaction.bind(controller));
router.post('/updateStaffTransaction', controller.updateTransaction.bind(controller));
router.post('/deleteStaffTransaction', controller.deleteTransaction.bind(controller));
router.post('/getStaffBalance', controller.getStaffBalance.bind(controller));

module.exports = router;
