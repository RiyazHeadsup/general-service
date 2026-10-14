const express = require('express');
const router = express.Router();
const {
  addMaintenanceMode,
  searchMaintenanceMode,
  updateMaintenanceMode,
  deleteMaintenanceMode,
  toggleMaintenanceMode
} = require('../controllers/maintenanceModeController');

// Admin only — getMaintenanceStatus / getUnitMaintenanceStatus are served
// publicly by the gateway
router.post('/addMaintenanceMode', addMaintenanceMode);
router.post('/searchMaintenanceMode', searchMaintenanceMode);
router.post('/updateMaintenanceMode', updateMaintenanceMode);
router.post('/deleteMaintenanceMode', deleteMaintenanceMode);
router.post('/toggleMaintenanceMode', toggleMaintenanceMode);

module.exports = router;
