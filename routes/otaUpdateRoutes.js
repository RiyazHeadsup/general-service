const express = require('express');
const router = express.Router();
const {
  addOtaUpdate,
  uploadOtaBundle,
  searchOtaUpdate,
  updateOtaUpdate,
  deleteOtaUpdate,
  checkOtaUpdate
} = require('../controllers/otaUpdateController');

// Admin (through the authenticated gateway proxy)
router.post('/addOtaUpdate', addOtaUpdate);
router.post('/uploadOtaBundle', uploadOtaBundle);
router.post('/searchOtaUpdate', searchOtaUpdate);
router.post('/updateOtaUpdate', updateOtaUpdate);
router.post('/deleteOtaUpdate', deleteOtaUpdate);

// Public: the gateway's /public/checkOtaUpdate forwards here
router.post('/checkOtaUpdate', checkOtaUpdate);

module.exports = router;
