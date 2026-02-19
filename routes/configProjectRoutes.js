const express = require('express');
const router = express.Router();
const {
  addConfigProject,
  searchConfigProject,
  updateConfigProject,
  deleteConfigProject
} = require('../controllers/configProjectController');

// CRUD Routes
router.post('/addConfigProject', addConfigProject);
router.post('/searchConfigProject', searchConfigProject);
router.post('/updateConfigProject', updateConfigProject);
router.post('/deleteConfigProject', deleteConfigProject);

module.exports = router;
