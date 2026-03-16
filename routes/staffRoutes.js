const express = require('express');
const staffController = require('../controllers/staffController');

const router = express.Router();

router.post('/addStaff', staffController.addStaff);
router.post('/searchStaff', staffController.searchStaff);
router.post('/updateStaff', staffController.updateStaff);
router.post('/deleteStaff', staffController.deleteStaff);
router.post('/updateStaffDetails', staffController.updateStaffDetails);
router.post('/toggleOnlineStatus', staffController.toggleOnlineStatus);
router.post('/getPartnerAnalytics', staffController.getPartnerAnalytics);
router.post('/togglePartnerBlock', staffController.togglePartnerBlock);
router.post('/checkPartnerBlocked', staffController.checkPartnerBlocked);
router.post('/getStaffProfile', staffController.getStaffProfile);

module.exports = router;
