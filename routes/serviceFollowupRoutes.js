const express = require('express');
const serviceFollowupController = require('../controllers/serviceFollowupController');

const router = express.Router();

// ServiceFollowup CRUD routes
router.post('/addServiceFollowup', serviceFollowupController.createServiceFollowup);
router.post('/searchServiceFollowup', serviceFollowupController.searchServiceFollowup);
router.post('/updateServiceFollowup', serviceFollowupController.updateServiceFollowup);
router.post('/deleteServiceFollowup', serviceFollowupController.deleteServiceFollowup);

// Additional routes
router.get('/getAllServiceFollowups', serviceFollowupController.getAllServiceFollowups);
router.get('/getServiceFollowup/:id', serviceFollowupController.getServiceFollowupById);

module.exports = router;
