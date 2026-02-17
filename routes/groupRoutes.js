const express = require('express');
const router = express.Router();
const {
  addGroup,
  searchGroup,
  updateGroup,
  deleteGroup
} = require('../controllers/groupController');

// CRUD Routes
router.post('/addGroup', addGroup);
router.post('/searchGroup', searchGroup);
router.post('/updateGroup', updateGroup);
router.post('/deleteGroup', deleteGroup);

module.exports = router;
