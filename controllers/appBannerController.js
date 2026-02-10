const AppBanner = require('../models/AppBanner');

class AppBannerController {
  async addAppBanner(req, res) {
    try {
      const { unitIds, title, imageUrl } = req.body;

      if (!unitIds) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'unitIds is required' });
      }
      if (!title) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'title is required' });
      }
      if (!imageUrl) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'imageUrl is required' });
      }

      const appBanner = new AppBanner(req.body);
      await appBanner.save();

      res.status(200).json({
        success: true,
        message: 'App banner created successfully',
        statusCode: 201,
        data: appBanner
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async searchAppBanner(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { order: 1, createdAt: -1 },
        populate: req.body.populate || [
          { path: 'unitIds', select: 'unitName unitCode' }
        ]
      };
      const result = await AppBanner.paginate(req.body.search || {}, options);
      res.json({ success: true, statusCode: 200, data: result });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async updateAppBanner(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'AppBanner ID is required' });
      }

      const appBanner = await AppBanner.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true });
      if (!appBanner) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'AppBanner not found' });
      }
      res.json({ success: true, statusCode: 200, data: appBanner });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async deleteAppBanner(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'AppBanner ID is required' });
      }

      const appBanner = await AppBanner.findByIdAndDelete(_id);
      if (!appBanner) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'AppBanner not found' });
      }
      res.json({ success: true, statusCode: 200, message: 'AppBanner deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }
}

module.exports = new AppBannerController();
