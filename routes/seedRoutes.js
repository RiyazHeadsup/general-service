const express = require('express');
const controller = require('../controllers/seedController');

const router = express.Router();

router.post('/importTemplatesToUnit', controller.importTemplatesToUnit);
router.post('/cloneServicesToUnit', controller.cloneServicesToUnit);

module.exports = router;
