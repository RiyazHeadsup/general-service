const AppConfig = require('../models/AppConfig');

class AppConfigController {
  // Get app config for a unit (create default if not exists)
  async getAppConfig(req, res) {
    try {
      const { unitIds } = req.body;

      if (!unitIds) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'unitIds is required'
        });
      }

      // Find existing config or create default
      let appConfig = await AppConfig.findOne({ unitIds });

      if (!appConfig) {
        // Create default config for the unit
        appConfig = new AppConfig({
          unitIds,
          maintenanceMode: {
            enabled: false,
            message: 'We are currently under maintenance. Please check back soon.'
          },
          bannerControl: {
            enabled: true
          },
          bookingEnabled: true,
          showPrices: true
        });
        await appConfig.save();
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: appConfig
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: error.message
      });
    }
  }

  // Update app config for a unit
  async updateAppConfig(req, res) {
    try {
      const { unitIds, maintenanceMode, bannerControl, bookingEnabled, showPrices } = req.body;

      if (!unitIds) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'unitIds is required'
        });
      }

      // Build update object
      const updateData = {};

      if (maintenanceMode !== undefined) {
        updateData.maintenanceMode = maintenanceMode;
      }
      if (bannerControl !== undefined) {
        updateData.bannerControl = bannerControl;
      }
      if (bookingEnabled !== undefined) {
        updateData.bookingEnabled = bookingEnabled;
      }
      if (showPrices !== undefined) {
        updateData.showPrices = showPrices;
      }
      if (req.body.categoriesConfig !== undefined) {
        updateData.categoriesConfig = req.body.categoriesConfig;
      }

      // Find and update, or create if not exists (upsert)
      const appConfig = await AppConfig.findOneAndUpdate(
        { unitIds },
        { $set: updateData },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'App configuration updated successfully',
        data: appConfig
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: error.message
      });
    }
  }
}

module.exports = new AppConfigController();
