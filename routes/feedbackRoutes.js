const express = require('express');
const feedbackController = require('../controllers/feedbackController');

const router = express.Router();

router.post('/addFeedback', feedbackController.addFeedback);
router.post('/searchFeedback', feedbackController.searchFeedback);
router.post('/deleteFeedback', feedbackController.deleteFeedback);

module.exports = router;
