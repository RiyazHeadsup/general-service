const express = require('express');
const clientController = require('../controllers/clientController');

const router = express.Router();

// Client CRUD routes
router.post('/addClients', clientController.createClient);
router.post('/searchClients', clientController.searchClient);
router.post('/updateClients', clientController.updateClient);
router.post('/deleteClients', clientController.deleteClient);

module.exports = router;