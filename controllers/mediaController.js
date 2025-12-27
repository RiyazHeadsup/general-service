const Media = require('../models/Media');

class MediaController {
  async addMedia(req, res) {
    try {
      const { deviceId, duration, type, orientation, source, isActive, unitIds } = req.body;

      if (!deviceId || !duration || !type || !source || !unitIds) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Missing required fields',
          error: 'deviceId, duration, type, source, and unitIds are required'
        });
      }

      if (!['image', 'video'].includes(type)) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Invalid media type',
          error: 'type must be either "image" or "video"'
        });
      }

      if (orientation && !['horizontal', 'vertical'].includes(orientation)) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Invalid orientation',
          error: 'orientation must be either "horizontal" or "vertical"'
        });
      }

      const mediaData = {
        deviceId,
        duration,
        type,
        source,
        isActive: isActive !== undefined ? isActive : true,
        unitIds
      };

      if (orientation) {
        mediaData.orientation = orientation;
      }

      const newMedia = new Media(mediaData);

      const savedMedia = await newMedia.save();

      return res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Media added successfully',
        data: savedMedia
      });
    } catch (error) {
      console.error('Error adding media:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to add media',
        error: error.message
      });
    }
  }

  async searchMedia(req, res) {
    try {
      const { page = 1, limit = 10, sort = { createdAt: -1 }, search = {}, populate = [] } = req.body;

      // Handle deviceCode search - convert to deviceId
      let searchQuery = { ...search };

      if (search.deviceCode) {
        const Device = require('../models/Device');
        const device = await Device.findOne({ deviceCode: search.deviceCode });

        if (device) {
          // Replace deviceCode with deviceId
          delete searchQuery.deviceCode;
          searchQuery.deviceId = device._id;
        } else {
          // Device not found, return empty result
          return res.status(200).json({
            success: true,
            statusCode: 200,
            message: 'No media found for this device code',
            data: {
              docs: [],
              totalDocs: 0,
              limit: parseInt(limit),
              totalPages: 0,
              page: parseInt(page),
              pagingCounter: 1,
              hasPrevPage: false,
              hasNextPage: false,
              prevPage: null,
              nextPage: null
            }
          });
        }
      }

      // Default populate for deviceId
      const defaultPopulate = [
        { path: 'deviceId', select: 'deviceCode deviceName deviceType resolution status orientation' },
        { path: 'unitIds', select: 'unitName unitCode' }
      ];

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        populate: populate.length > 0 ? populate : defaultPopulate
      };

      const result = await Media.paginate(searchQuery, options);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Media retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error searching media:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to search media',
        error: error.message
      });
    }
  }

  async updateMedia(req, res) {
    try {
      const { _id, ...updateData } = req.body;

      if (!_id) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Missing media ID',
          error: '_id is required for update'
        });
      }

      if (updateData.type && !['image', 'video'].includes(updateData.type)) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Invalid media type',
          error: 'type must be either "image" or "video"'
        });
      }

      if (updateData.orientation && !['horizontal', 'vertical'].includes(updateData.orientation)) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Invalid orientation',
          error: 'orientation must be either "horizontal" or "vertical"'
        });
      }

      const updatedMedia = await Media.findByIdAndUpdate(
        _id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedMedia) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          message: 'Media not found',
          error: 'No media found with the provided ID'
        });
      }

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Media updated successfully',
        data: updatedMedia
      });
    } catch (error) {
      console.error('Error updating media:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to update media',
        error: error.message
      });
    }
  }

  async deleteMedia(req, res) {
    try {
      const { _id } = req.body;

      if (!_id) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Missing media ID',
          error: '_id is required for deletion'
        });
      }

      const deletedMedia = await Media.findByIdAndDelete(_id);

      if (!deletedMedia) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          message: 'Media not found',
          error: 'No media found with the provided ID'
        });
      }

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Media deleted successfully',
        data: deletedMedia
      });
    } catch (error) {
      console.error('Error deleting media:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to delete media',
        error: error.message
      });
    }
  }

  async incrementView(req, res) {
    try {
      const { _id, deviceId } = req.body;

      if (!_id) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Media ID is required'
        });
      }

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Device ID is required for view tracking'
        });
      }

      const media = await Media.findById(_id);
      if (!media) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          message: 'Media not found'
        });
      }

      const AdView = require('../models/AdView');

      // Check if this device has viewed this ad before
      let adView = await AdView.findOne({ mediaId: _id, deviceId: deviceId });

      let isUniqueView = false;

      if (!adView) {
        // First time this device is viewing this ad
        isUniqueView = true;

        adView = new AdView({
          mediaId: _id,
          deviceId: deviceId,
          viewCount: 1,
          firstViewedAt: new Date(),
          lastViewedAt: new Date()
        });

        await adView.save();

        // Increment unique view count
        media.uniqueViewCount += 1;
        media.lastViewedAt = new Date();
        await media.save();
      } else {
        // Device has viewed before, just update lastViewedAt and viewCount
        adView.viewCount += 1;
        adView.lastViewedAt = new Date();
        await adView.save();
      }

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: isUniqueView ? 'Unique view recorded' : 'View count updated',
        data: {
          uniqueViewCount: media.uniqueViewCount,
          isUniqueView: isUniqueView,
          deviceViewCount: adView.viewCount
        }
      });

    } catch (error) {
      console.error('Error incrementing view:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new MediaController();
