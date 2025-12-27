const express = require('express');
const deviceController = require('../controllers/deviceController');

const router = express.Router();

// Device routes
router.post('/registerDevice', deviceController.registerDevice);
router.post('/searchDevice', deviceController.searchDevice);
router.post('/updateDevice', deviceController.updateDevice);
router.post('/deleteDevice', deviceController.deleteDevice);
router.get('/getDeviceByCode/:deviceCode', deviceController.getDeviceByCode);

module.exports = router;
