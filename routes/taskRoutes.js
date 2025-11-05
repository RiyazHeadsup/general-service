const express = require('express');
const taskController = require('../controllers/taskController');

const router = express.Router();

// Task CRUD routes
router.post('/createTask', taskController.createTask);
router.post('/searchTask', taskController.searchTask);
router.post('/updateTask', taskController.updateTask);
router.post('/deleteTask', taskController.deleteTask);

module.exports = router;