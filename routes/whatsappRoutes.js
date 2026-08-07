const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Config (called from the admin panel — authenticated via gateway)
router.post('/getWhatsappConfig', whatsappController.getWhatsappConfig);
router.post('/saveWhatsappConfig', whatsappController.saveWhatsappConfig);
router.post('/listWhatsappOptIns', whatsappController.listWhatsappOptIns);
router.post('/sendWhatsappBill', whatsappController.sendBill);
router.post('/sendWhatsappMarketing', whatsappController.sendMarketingMessage);
router.post('/whatsappBillSentStatus', whatsappController.billSentStatus);

// Message templates (synced from Meta)
router.post('/listWhatsappTemplates', whatsappController.listTemplates);
router.post('/uploadWhatsappTemplateMedia', whatsappController.uploadTemplateMedia);
router.post('/createWhatsappTemplate', whatsappController.createTemplate);
router.post('/editWhatsappTemplate', whatsappController.editTemplate);
router.post('/deleteWhatsappTemplate', whatsappController.deleteTemplate);

// Webhook (called by Meta — must be publicly reachable, no auth)
router.get('/whatsappWebhook', whatsappController.verifyWebhook);
router.post('/whatsappWebhook', whatsappController.receiveWebhook);

module.exports = router;
