const Media = require('../models/Media');

class MediaController {
  async addMedia(req, res) {
    try {
      const { duration, type, orientation, source, isActive, unitIds } = req.body;

      if (!duration || !type || !orientation || !source || !unitIds) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Missing required fields',
          error: 'duration, type, orientation, source, and unitIds are required'
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

      if (!['horizontal', 'vertical'].includes(orientation)) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Invalid orientation',
          error: 'orientation must be either "horizontal" or "vertical"'
        });
      }

      const newMedia = new Media({
        duration,
        type,
        orientation,
        source,
        isActive: isActive !== undefined ? isActive : true,
        unitIds
      });

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

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        populate
      };

      const result = await Media.paginate(search, options);

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
}

module.exports = new MediaController();
