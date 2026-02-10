const express = require('express');
const childServiceController = require('../controllers/childServiceController');

const router = express.Router();

// ChildService CRUD routes
router.post('/addChild', childServiceController.createChildService);
router.post('/searchChild', childServiceController.searchChildService);
router.post('/updateChild', childServiceController.updateChildService);
router.post('/deleteChild', childServiceController.deleteChildService);

module.exports = router;