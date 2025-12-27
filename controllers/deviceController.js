const Device = require('../models/Device');

// Generate unique device code like ELV-2121
async function generateDeviceCode() {
  let deviceCode;
  let isUnique = false;

  while (!isUnique) {
    // Generate random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    deviceCode = `ELV-${randomNum}`;

    // Check if code already exists
    const existingDevice = await Device.findOne({ deviceCode });
    if (!existingDevice) {
      isUnique = true;
    }
  }

  return deviceCode;
}

class DeviceController {
  async registerDevice(req, res) {
    try {
      // Generate unique device code
      const deviceCode = await generateDeviceCode();

      // Create device with generated code
      const deviceData = {
        ...req.body,
        deviceCode
      };

      const device = new Device(deviceData);
      await device.save();

      res.status(201).json({
        success: true,
        message: "Device registered successfully",
        statusCode: 201,
        data: {
          deviceCode: device.deviceCode,
          deviceName: device.deviceName,
          deviceType: device.deviceType,
          isVertical: device.isVertical,
          resolution: device.resolution,
          lat: device.lat,
          lng: device.lng,
          status: device.status,
          orientation: device.orientation,
          unitIds: device.unitIds,
          _id: device._id,
          createdAt: device.createdAt,
          updatedAt: device.updatedAt
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
        statusCode: 400
      });
    }
  }

  async searchDevice(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 }
      };
      const devices = await Device.paginate(req.body.search || {}, options);
      res.json({
        success: true,
        statusCode: 200,
        data: devices
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        statusCode: 500,
        error: error.message
      });
    }
  }

  async updateDevice(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({
          success: false,
          error: 'Device ID is required',
          statusCode: 400
        });
      }

      // Prevent updating deviceCode
      delete req.body.deviceCode;

      const device = await Device.findByIdAndUpdate(_id, req.body, { new: true });
      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Device not found',
          statusCode: 404
        });
      }

      res.json({
        success: true,
        statusCode: 200,
        data: device
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
        statusCode: 400
      });
    }
  }

  async deleteDevice(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({
          success: false,
          error: 'Device ID is required',
          statusCode: 400
        });
      }
      const device = await Device.findByIdAndRemove(_id);
      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Device not found',
          statusCode: 404
        });
      }
      res.json({
        success: true,
        statusCode: 200,
        message: 'Device deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        statusCode: 500
      });
    }
  }

  async getDeviceByCode(req, res) {
    try {
      const { deviceCode } = req.params;
      const device = await Device.findOne({ deviceCode });

      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Device not found',
          statusCode: 404
        });
      }

      res.json({
        success: true,
        statusCode: 200,
        data: device
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        statusCode: 500
      });
    }
  }
}

module.exports = new DeviceController();
