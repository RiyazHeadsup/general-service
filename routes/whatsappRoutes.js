const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Config (called from the admin panel — authenticated via gateway)
router.post('/getWhatsappConfig', whatsappController.getWhatsappConfig);
router.post('/saveWhatsappConfig', whatsappController.saveWhatsappConfig);
router.post('/listWhatsappOptIns', whatsappController.listWhatsappOptIns);

// Webhook (called by Meta — must be publicly reachable, no auth)
router.get('/whatsappWebhook', whatsappController.verifyWebhook);
router.post('/whatsappWebhook', whatsappController.receiveWebhook);

module.exports = router;
