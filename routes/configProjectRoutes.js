const express = require('express');
const configProjectController = require('../controllers/configProjectController');

const router = express.Router();

// ConfigProject Admin CRUD routes
router.post('/addConfigProject', configProjectController.addConfigProject);
router.post('/searchConfigProject', configProjectController.searchConfigProject);
router.post('/updateConfigProject', configProjectController.updateConfigProject);
router.post('/deleteConfigProject', configProjectController.deleteConfigProject);

module.exports = router;
