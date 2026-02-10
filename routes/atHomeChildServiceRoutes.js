const express = require('express');
const atHomeChildServiceController = require('../controllers/atHomeChildServiceController');

const router = express.Router();

// AtHomeChildService CRUD routes
router.post('/addAtHomeChild', atHomeChildServiceController.createAtHomeChildService);
router.post('/searchAtHomeChild', atHomeChildServiceController.searchAtHomeChildService);
router.post('/updateAtHomeChild', atHomeChildServiceController.updateAtHomeChildService);
router.post('/deleteAtHomeChild', atHomeChildServiceController.deleteAtHomeChildService);

module.exports = router;
