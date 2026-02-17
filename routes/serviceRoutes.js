const express = require('express');
const router = express.Router();
const {
  addService,
  searchService,
  updateService,
  deleteService,
  transferService
} = require('../controllers/serviceController');

// CRUD Routes
router.post('/addService', addService);
router.post('/searchService', searchService);
router.post('/updateService', updateService);
router.post('/deleteService', deleteService);
router.post('/transferService', transferService);

module.exports = router;
