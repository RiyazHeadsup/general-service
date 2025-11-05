const Client = require('../models/Client');
const Wallet = require('../models/Wallet');

class ClientController {
  async createClient(req, res) {
    try {
      const client = new Client(req.body);
      await client.save();
      
      const wallet = new Wallet({
        clientId: client._id,
        balance: 0,
        totalCredits: 0,
        totalDebits: 0,
        isActive: true,
        isFrozen: false
      });
      await wallet.save();
      
      client.walletId = wallet._id;
      await client.save();
      
      res.status(200).json({
        success: true,
        message: "client created successfully",
        statusCode: 201,
        data: client
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchClient(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'unitIds', select: 'unitName unitCode' },
          { path: 'walletId', select: 'balance totalCredits totalDebits isActive isFrozen' }
        ]
      };
      const clients = await Client.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: clients });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateClient(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Client ID is required' });
      }
      
      const client = await Client.findByIdAndUpdate(_id, req.body, { new: true }).populate('walletId');
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      // Create wallet only if client doesn't have one
      if (!client.walletId) {
        const wallet = new Wallet({
          clientId: client._id,
          balance: 0,
          totalCredits: 0,
          totalDebits: 0,
          isActive: true,
          isFrozen: false
        });
        await wallet.save();
        
        client.walletId = wallet._id;
        await client.save();
      }
      
      res.json({ statusCode: 200, data: client });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteClient(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Client ID is required' });
      }
      const client = await Client.findByIdAndRemove(_id);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      res.json({ statusCode: 200, message: 'Client deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ClientController();