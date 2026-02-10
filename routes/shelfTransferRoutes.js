const express = require('express');
const shelfTransferController = require('../controllers/shelfTransferController');

const router = express.Router();

// ShelfTransfer CRUD routes
router.post('/addShelfTransfer', shelfTransferController.createShelfTransfer);
router.post('/searchShelfTransfer', shelfTransferController.searchShelfTransfer);
router.post('/updateShelfTransfer', shelfTransferController.updateShelfTransfer);
router.post('/deleteShelfTransfer', shelfTransferController.deleteShelfTransfer);

module.exports = router;