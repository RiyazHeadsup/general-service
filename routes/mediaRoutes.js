const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');

router.post('/addMedia', (req, res) => mediaController.addMedia(req, res));
router.post('/searchMedia', (req, res) => mediaController.searchMedia(req, res));
router.post('/updateMedia', (req, res) => mediaController.updateMedia(req, res));
router.post('/deleteMedia', (req, res) => mediaController.deleteMedia(req, res));

module.exports = router;
