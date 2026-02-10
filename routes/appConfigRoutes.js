const express = require('express');
const appConfigController = require('../controllers/appConfigController');

const router = express.Router();

// App Config routes
router.post('/getAppConfig', appConfigController.getAppConfig);
router.post('/updateAppConfig', appConfigController.updateAppConfig);

module.exports = router;
