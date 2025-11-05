const Attendance = require('../models/Attendance');
const User = require('../models/User');

class AttendanceController {
  async createAttendance(req, res) {
    try {
      const attendance = new Attendance(req.body);
      await attendance.save();
      res.status(200).json({
        success: true,
        message: "attendance created successfully",
        statusCode: 201,
        data: attendance
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchAttendance(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { created: -1 },
        populate: req.body.populate || [
          { path: 'userId'},
          { path: 'unitIds', select: 'unitName unitCode' }
        ]
      };
      const attendances = await Attendance.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: attendances });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateAttendance(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Attendance ID is required' });
      }
      
      const attendance = await Attendance.findByIdAndUpdate(_id, req.body, { new: true });
      if (!attendance) {
        return res.status(404).json({ error: 'Attendance not found' });
      }
      res.json({ statusCode: 200, data: attendance });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteAttendance(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Attendance ID is required' });
      }
      const attendance = await Attendance.findByIdAndRemove(_id);
      if (!attendance) {
        return res.status(404).json({ error: 'Attendance not found' });
      }
      res.json({ statusCode:200, message: 'Attendance deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAttendanceById(req, res) {
    try {
      const { id } = req.params;
      const attendance = await Attendance.findById(id)
        .populate('userId', 'name email')
        .populate('unitIds', 'unitName unitCode');
      if (!attendance) {
        return res.status(404).json({ error: 'Attendance not found' });
      }
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllAttendances(req, res) {
    try {
      const attendances = await Attendance.find()
        .populate('userId', 'name email')
        .populate('unitIds', 'unitName unitCode')
        .sort({ created: -1 });
      res.json(attendances);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAttendanceByUserId(req, res) {
    try {
      const { userId } = req.params;
      const attendances = await Attendance.find({ userId })
        .populate('userId', 'name email')
        .populate('unitIds', 'unitName unitCode')
        .sort({ created: -1 });
      res.json(attendances);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAttendanceByUnitId(req, res) {
    try {
      const { unitId } = req.params;
      const attendances = await Attendance.find({ unitIds: unitId })
        .populate('userId', 'name email')
        .populate('unitIds', 'unitName unitCode')
        .sort({ created: -1 });
      res.json(attendances);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AttendanceController();