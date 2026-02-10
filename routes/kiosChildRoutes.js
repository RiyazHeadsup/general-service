const express = require('express');
const kiosChildController = require('../controllers/kiosChildController');

const router = express.Router();

// KiosChild CRUD routes
router.post('/addKiosChild', kiosChildController.createKiosChild);
router.post('/searchKiosChild', kiosChildController.searchKiosChild);
router.post('/updateKiosChild', kiosChildController.updateKiosChild);
router.post('/deleteKiosChild', kiosChildController.deleteKiosChild);

module.exports = router;
