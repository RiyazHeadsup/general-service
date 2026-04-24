const Staff = require('../models/Staff');
const StaffLocationLog = require('../models/StaffLocationLog');

class StaffController {
  async addStaff(req, res) {
    try {
      const { name, phoneNumber } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Name is required' });
      }
      if (!phoneNumber) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Phone number is required' });
      }

      // Check duplicate per unit
      const unitIds = req.body.unitIds || [];
      const unitId = Array.isArray(unitIds) ? unitIds[0] : unitIds;
      const dupeQuery = { phoneNumber };
      if (unitId) dupeQuery.unitIds = unitId;
      const existing = await Staff.findOne(dupeQuery);
      if (existing) {
        return res.status(409).json({ success: false, statusCode: 409, message: 'Staff with this phone number already exists in this unit' });
      }

      const staff = new Staff(req.body);
      await staff.save();

      res.status(200).json({
        success: true,
        statusCode: 201,
        message: 'Staff created successfully',
        data: staff
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async searchStaff(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'roleId', select: 'name' },
          { path: 'unitIds', select: 'unitName unitCode' }
        ]
      };
      const searchQuery = req.body.search || {};
      // Cast unitIds string to ObjectId for array matching
      if (searchQuery.unitIds && typeof searchQuery.unitIds === 'string') {
        const mongoose = require('mongoose');
        searchQuery.unitIds = new mongoose.Types.ObjectId(searchQuery.unitIds);
      }
      const result = await Staff.paginate(searchQuery, options);
      res.json({ success: true, statusCode: 200, data: result });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async updateStaff(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Staff ID is required' });
      }

      const staff = await Staff.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true });
      if (!staff) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Staff not found' });
      }
      res.json({ success: true, statusCode: 200, data: staff });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async deleteStaff(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Staff ID is required' });
      }

      const staff = await Staff.findByIdAndDelete(_id);
      if (!staff) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Staff not found' });
      }
      res.json({ success: true, statusCode: 200, message: 'Staff deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  // Called from partner app to submit staff details
  async updateStaffDetails(req, res) {
    try {
      const {
        _id, name, email, gender, experience, specialisation, lastWorkingLocation,
        address, policeVerification, addressProof, dob, height, weight, bodyDimension, clothSize,
        colorComplexion, profilePic, additionalPhotos, knownDiseases, maritalStatus,
        kids, monthlyIncome, familyIncome, foodPreference, speakingSkill,
        angerIssues, hygiene, hasToolKit, unitIds, workingWindows, bankDetails
      } = req.body;
      if (!_id) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Staff ID is required' });
      }
      if (!name) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Name is required' });
      }

      const updateData = { name, isStaffDetailsReceived: true };
      if (email) updateData.email = email;
      if (gender) updateData.gender = gender;
      if (experience) updateData.experience = experience;
      if (specialisation) updateData.specialisation = specialisation;
      if (lastWorkingLocation) updateData.lastWorkingLocation = lastWorkingLocation;
      if (address) updateData.address = address;
      if (policeVerification) updateData.policeVerification = policeVerification;
      if (addressProof) updateData.addressProof = addressProof;
      if (dob) updateData.dob = dob;
      if (height) updateData.height = height;
      if (weight) updateData.weight = weight;
      if (bodyDimension) updateData.bodyDimension = bodyDimension;
      if (clothSize) updateData.clothSize = clothSize;
      if (colorComplexion) updateData.colorComplexion = colorComplexion;
      if (profilePic) updateData.profilePic = profilePic;
      if (additionalPhotos) updateData.additionalPhotos = additionalPhotos;
      if (knownDiseases) updateData.knownDiseases = knownDiseases;
      if (maritalStatus) updateData.maritalStatus = maritalStatus;
      if (kids) updateData.kids = kids;
      if (monthlyIncome) updateData.monthlyIncome = monthlyIncome;
      if (familyIncome) updateData.familyIncome = familyIncome;
      if (foodPreference) updateData.foodPreference = foodPreference;
      if (speakingSkill) updateData.speakingSkill = speakingSkill;
      if (angerIssues) updateData.angerIssues = angerIssues;
      if (hygiene) updateData.hygiene = hygiene;
      if (hasToolKit !== undefined) updateData.hasToolKit = hasToolKit;
      if (unitIds && Array.isArray(unitIds)) updateData.unitIds = unitIds;
      if (workingWindows && Array.isArray(workingWindows)) updateData.workingWindows = workingWindows;
      if (bankDetails && typeof bankDetails === 'object') updateData.bankDetails = bankDetails;

      const staff = await Staff.findByIdAndUpdate(_id, updateData, { new: true, runValidators: true });
      if (!staff) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Staff not found' });
      }

      res.json({
        success: true,
        statusCode: 200,
        message: 'Staff details updated successfully',
        data: staff
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }
  async toggleOnlineStatus(req, res) {
    try {
      const { _id, isOnline, latitude, longitude } = req.body;
      if (!_id) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Staff ID is required' });
      }
      if (typeof isOnline !== 'boolean') {
        return res.status(400).json({ success: false, statusCode: 400, message: 'isOnline must be a boolean' });
      }

      const updateData = { isOnline };
      if (isOnline && latitude && longitude) {
        updateData.location = {
          type: 'Point',
          coordinates: [longitude, latitude]
        };
        updateData.lastLocationUpdate = new Date();
      }

      const staff = await Staff.findByIdAndUpdate(_id, updateData, { new: true });
      if (!staff) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Staff not found' });
      }

      // Log location
      await StaffLocationLog.create({
        staffId: _id,
        location: {
          type: 'Point',
          coordinates: latitude && longitude ? [longitude, latitude] : [0, 0]
        },
        action: isOnline ? 'online' : 'offline',
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || ''
      });

      res.json({
        success: true,
        statusCode: 200,
        message: `Staff is now ${isOnline ? 'online' : 'offline'}`,
        data: staff
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async getPartnerAnalytics(req, res) {
    try {
      const { page = 1, limit = 20, search = '', filter = 'all' } = req.body;

      const totalPartners = await Staff.countDocuments({ isActive: true });
      const onlinePartners = await Staff.countDocuments({ isActive: true, isOnline: true });
      const offlinePartners = totalPartners - onlinePartners;

      // Build query for partner list
      const query = { isActive: true };
      if (filter === 'online') query.isOnline = true;
      if (filter === 'offline') query.isOnline = false;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { isOnline: -1, updatedAt: -1 },
        select: 'name phoneNumber email gender experience specialisation address isOnline unitIds profilePic createdAt lastLocationUpdate isActive isPartnerBlocked blockedBy blockedAt location rating incomePercentage',
        populate: [
          { path: 'unitIds', select: 'unitName unitCode' },
          { path: 'blockedBy', select: 'name email' }
        ]
      };

      const partners = await Staff.paginate(query, options);

      res.json({
        success: true,
        statusCode: 200,
        message: 'Partner analytics fetched successfully',
        data: {
          totalPartners,
          onlinePartners,
          offlinePartners,
          partners
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async togglePartnerBlock(req, res) {
    try {
      const { _id, isPartnerBlocked, blockedBy } = req.body;
      if (!_id) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Partner ID is required' });
      }
      if (typeof isPartnerBlocked !== 'boolean') {
        return res.status(400).json({ success: false, statusCode: 400, message: 'isPartnerBlocked must be a boolean' });
      }

      const updateData = {
        isPartnerBlocked,
        blockedBy: isPartnerBlocked ? (blockedBy || null) : null,
        blockedAt: isPartnerBlocked ? new Date() : null
      };

      const staff = await Staff.findByIdAndUpdate(_id, updateData, { new: true })
        .populate('blockedBy', 'name email');

      if (!staff) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Partner not found' });
      }

      res.json({
        success: true,
        statusCode: 200,
        message: `Partner ${isPartnerBlocked ? 'blocked' : 'unblocked'} successfully`,
        data: staff
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async checkPartnerBlocked(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Partner ID is required' });
      }

      const staff = await Staff.findById(_id).select('isPartnerBlocked blockedAt');
      if (!staff) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Partner not found' });
      }

      res.json({
        success: true,
        statusCode: 200,
        data: {
          isPartnerBlocked: staff.isPartnerBlocked || false,
          blockedAt: staff.blockedAt || null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async getStaffProfile(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ success: false, statusCode: 400, message: 'Staff ID is required' });
      }

      const staff = await Staff.findById(_id)
        .select('name phoneNumber email incomePercentage rating isOnline isPartnerBlocked workingWindows unitIds isActive bankDetails')
        .populate('unitIds', 'unitName unitCode');

      if (!staff) {
        return res.status(404).json({ success: false, statusCode: 404, message: 'Staff not found' });
      }

      res.json({
        success: true,
        statusCode: 200,
        data: staff
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }
}

module.exports = new StaffController();
