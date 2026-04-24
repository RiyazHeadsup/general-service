const Client = require('../models/Client');
const Wallet = require('../models/Wallet');

class ClientController {
  async createClient(req, res) {
    try {
      // Handle unitIds as array from frontend (model expects single ObjectId)
      if (Array.isArray(req.body.unitIds)) {
        req.body.unitIds = req.body.unitIds[0] || null;
      }
      // Fallback: use unitId if unitIds not provided
      if (!req.body.unitIds && req.body.unitId) {
        req.body.unitIds = req.body.unitId;
      }

      // Check duplicate: same phoneNumber + same unit
      if (req.body.phoneNumber && req.body.unitIds) {
        const existing = await Client.findOne({
          phoneNumber: req.body.phoneNumber,
          unitIds: req.body.unitIds,
          isActive: { $ne: false }
        });
        if (existing) {
          return res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Client with this phone number already exists in this unit'
          });
        }
      }

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

      // Handle unitIds as array from frontend
      if (Array.isArray(req.body.unitIds)) {
        req.body.unitIds = req.body.unitIds[0] || null;
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

  async deleteAccount(req, res) {
    try {
      const { _id, reason } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Client ID is required' });
      }

      const client = await Client.findById(_id);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Soft delete — mark inactive, anonymize personal data
      await Client.findByIdAndUpdate(_id, {
        isActive: false,
        name: 'Deleted User',
        $unset: { email: 1, img: 1, address: 1 },
        deletedAt: new Date(),
        deleteReason: reason || '',
      });

      res.json({ statusCode: 200, success: true, message: 'Account deleted successfully' });
    } catch (error) {
      console.error('deleteAccount error:', error);
      res.status(500).json({ success: false, statusCode: 500, error: error.message, message: 'Failed to delete account: ' + error.message });
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