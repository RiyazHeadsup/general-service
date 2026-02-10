const express = require('express');
const generalController = require('../controllers/generalController');

const router = express.Router();

// General CRUD routes
router.post('/addGeneral', generalController.createGeneral);
router.post('/searchGeneral', generalController.searchGeneral);
router.post('/updateGeneral', generalController.updateGeneral);
router.post('/deleteGeneral', generalController.deleteGeneral);

module.exports = router;