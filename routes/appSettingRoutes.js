const express = require('express');
const router = express.Router();
const {
  getAppSetting,
  setAppSetting,
  getAllAppSettings,
  getSalonMode,
  toggleSalonMode,
  getWorkingHours,
  setWorkingHours,
  getSubscriptionFlow,
  toggleSubscriptionFlow
} = require('../controllers/appSettingController');

router.post('/getAppSetting', getAppSetting);
router.post('/setAppSetting', setAppSetting);
router.post('/getAllAppSettings', getAllAppSettings);
router.post('/getSalonMode', getSalonMode);
router.post('/toggleSalonMode', toggleSalonMode);
router.post('/getWorkingHours', getWorkingHours);
router.post('/setWorkingHours', setWorkingHours);
router.post('/getSubscriptionFlow', getSubscriptionFlow);
router.post('/toggleSubscriptionFlow', toggleSubscriptionFlow);

module.exports = router;
