const Address = require('../models/Address');

class AddressController {
  async addAddress(req, res) {
    try {
      const { clientId } = req.body;
      if (!clientId) {
        return res.status(400).json({ error: 'clientId is required' });
      }

      const existingCount = await Address.countDocuments({ clientId });
      const addressData = {
        ...req.body,
        isActive: existingCount === 0
      };

      const address = new Address(addressData);
      await address.save();

      res.status(200).json({
        success: true,
        message: 'Address added successfully',
        statusCode: 201,
        data: address
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchAddress(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 20,
        sort: req.body.sort || { isActive: -1, createdAt: -1 }
      };
      const addresses = await Address.paginate(req.body.search || {}, options);
      res.json({ statusCode: 200, data: addresses });
    } catch (error) {
      res.status(500).json({ statusCode: 500, error: error.message });
    }
  }

  async updateAddress(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Address ID is required' });
      }
      const address = await Address.findByIdAndUpdate(_id, req.body, { new: true });
      if (!address) {
        return res.status(404).json({ error: 'Address not found' });
      }
      res.json({ statusCode: 200, data: address });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteAddress(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Address ID is required' });
      }
      const address = await Address.findByIdAndDelete(_id);
      if (!address) {
        return res.status(404).json({ error: 'Address not found' });
      }

      if (address.isActive) {
        const nextAddress = await Address.findOne({ clientId: address.clientId })
          .sort({ createdAt: -1 });
        if (nextAddress) {
          nextAddress.isActive = true;
          await nextAddress.save();
        }
      }

      res.json({ statusCode: 200, message: 'Address deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async setActiveAddress(req, res) {
    try {
      const { _id, clientId } = req.body;
      if (!_id || !clientId) {
        return res.status(400).json({ error: 'Address ID and clientId are required' });
      }

      await Address.updateMany(
        { clientId, isActive: true },
        { $set: { isActive: false } }
      );

      const address = await Address.findByIdAndUpdate(
        _id,
        { isActive: true },
        { new: true }
      );
      if (!address) {
        return res.status(404).json({ error: 'Address not found' });
      }

      res.json({ statusCode: 200, data: address, message: 'Active address updated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AddressController();
