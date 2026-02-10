const express = require('express');
const kiosParentController = require('../controllers/kiosParentController');

const router = express.Router();

// KiosParent CRUD routes
router.post('/addKiosParent', kiosParentController.createKiosParent);
router.post('/searchKiosParent', kiosParentController.searchKiosParent);
router.post('/updateKiosParent', kiosParentController.updateKiosParent);
router.post('/deleteKiosParent', kiosParentController.deleteKiosParent);

module.exports = router;
