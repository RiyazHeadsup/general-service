const express = require('express');
const router = express.Router();
const mailController = require('../controllers/mailController');

// Sending account (SMTP)
router.post('/getMailConfig', mailController.getMailConfig);
router.post('/saveMailConfig', mailController.saveMailConfig);
router.post('/verifyMailSmtp', mailController.verifyMailSmtp);

// Templates
router.post('/listMailTemplates', mailController.listMailTemplates);
router.post('/seedMailTemplates', mailController.seedMailTemplates);
router.post('/createMailTemplate', mailController.createMailTemplate);
router.post('/editMailTemplate', mailController.editMailTemplate);
router.post('/deleteMailTemplate', mailController.deleteMailTemplate);

// Sending
router.post('/sendMailTest', mailController.sendMailTest);
router.post('/sendMailMerge', mailController.sendMailMerge);

// History
router.post('/listMailSent', mailController.listMailSent);
router.post('/clearMailSent', mailController.clearMailSent);

module.exports = router;
