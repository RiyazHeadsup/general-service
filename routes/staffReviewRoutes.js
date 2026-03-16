const express = require('express');
const staffReviewController = require('../controllers/staffReviewController');

const router = express.Router();

router.post('/addStaffReview', staffReviewController.addReview);
router.post('/searchStaffReview', staffReviewController.searchReviews);
router.post('/updateStaffReview', staffReviewController.updateReview);
router.post('/deleteStaffReview', staffReviewController.deleteReview);
router.post('/getStaffRating', staffReviewController.getStaffRating);

module.exports = router;
