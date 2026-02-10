const express = require('express');
const atHomeParentController = require('../controllers/atHomeParentController');

const router = express.Router();

// AtHomeParent CRUD routes
router.post('/addAtHomeParent', atHomeParentController.createAtHomeParent);
router.post('/searchAtHomeParent', atHomeParentController.searchAtHomeParent);
router.post('/updateAtHomeParent', atHomeParentController.updateAtHomeParent);
router.post('/deleteAtHomeParent', atHomeParentController.deleteAtHomeParent);

module.exports = router;
