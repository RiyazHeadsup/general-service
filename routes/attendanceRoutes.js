const express = require('express');
const attendanceController = require('../controllers/attendanceController');

const router = express.Router();

// Attendance CRUD routes
router.post('/addAttendance', attendanceController.createAttendance);
router.post('/searchAttendance', attendanceController.searchAttendance);
router.post('/updateAttendance', attendanceController.updateAttendance);
router.post('/deleteAttendance', attendanceController.deleteAttendance);


module.exports = router;