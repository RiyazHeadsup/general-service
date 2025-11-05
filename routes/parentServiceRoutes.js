const express = require('express');
const parentServiceController = require('../controllers/parentServiceController');

const router = express.Router();

// ParentService CRUD routes
router.post('/addParent', parentServiceController.createParentService);
router.post('/searchParent', parentServiceController.searchParentService);
router.post('/updateParent', parentServiceController.updateParentService);
router.post('/deleteParent', parentServiceController.deleteParentService);

module.exports = router;