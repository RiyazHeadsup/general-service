const express = require('express');
const router = express.Router();
const {
  addHomeSection,
  searchHomeSection,
  updateHomeSection,
  deleteHomeSection
} = require('../controllers/homeSectionController');

router.post('/addHomeSection', addHomeSection);
router.post('/searchHomeSection', searchHomeSection);
router.post('/updateHomeSection', updateHomeSection);
router.post('/deleteHomeSection', deleteHomeSection);

module.exports = router;
