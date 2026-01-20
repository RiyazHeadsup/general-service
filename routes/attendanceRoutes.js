const express = require('express');
const attendanceController = require('../controllers/attendanceController');

const router = express.Router();

// Attendance CRUD routes
// Attendance CRUD routes
router.post('/addAttendance', attendanceController.createAttendance.bind(attendanceController));
router.post('/searchAttendance', attendanceController.searchAttendance.bind(attendanceController));
router.post('/updateAttendance', attendanceController.updateAttendance.bind(attendanceController));
router.post('/deleteAttendance', attendanceController.deleteAttendance.bind(attendanceController));


module.exports = router;