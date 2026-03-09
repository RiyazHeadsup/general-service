const express = require('express');
const router = express.Router();
const {
  addHairColorService,
  searchHairColorService,
  updateHairColorService,
  deleteHairColorService
} = require('../controllers/hairColorServiceController');

// CRUD Routes
router.post('/addHairColorService', addHairColorService);
router.post('/searchHairColorService', searchHairColorService);
router.post('/updateHairColorService', updateHairColorService);
router.post('/deleteHairColorService', deleteHairColorService);

module.exports = router;
