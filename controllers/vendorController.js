const Vendor = require('../models/Vendor');

class VendorController {
  async createVendor(req, res) {
    try {
      const vendor = new Vendor(req.body);
      await vendor.save();
      res.status(200).json({
        success: true,
        message: "vendor created successfully",
        statusCode: 201,
        data: vendor
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchVendor(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'unitIds', select: 'unitName unitCode' }
        ]
      };
      const vendors = await Vendor.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: vendors });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateVendor(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Vendor ID is required' });
      }
      
      const vendor = await Vendor.findByIdAndUpdate(_id, req.body, { new: true });
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      res.json({ statusCode: 200, data: vendor });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteVendor(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Vendor ID is required' });
      }
      const vendor = await Vendor.findByIdAndRemove(_id);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      res.json({ statusCode: 200, message: 'Vendor deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new VendorController();