const ServiceFollowup = require('../models/ServiceFollowup');

class ServiceFollowupController {
  async createServiceFollowup(req, res) {
    try {
      const serviceFollowup = new ServiceFollowup(req.body);
      await serviceFollowup.save();
      res.status(200).json({
        success: true,
        message: "service followup created successfully",
        statusCode: 201,
        data: serviceFollowup
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchServiceFollowup(req, res) {
    try {
      const page = parseInt(req.body.page) || 1;
      const limit = parseInt(req.body.limit) || 10;
      const skip = (page - 1) * limit;
      const sort = req.body.sort || { createdAt: -1 };
      const search = req.body.search || {};

      // Manual pagination with populate
      const [docs, totalDocs] = await Promise.all([
        ServiceFollowup.find(search)
          .populate({
            path: 'clientId',
            select: 'name email phoneNumber gender img address customerType totalVisit unpaidAmt'
          })
          .populate({
            path: 'followupBy',
            select: 'name email phoneNumber gender img roleId'
          })
          .populate({
            path: 'unitId',
            select: 'unitName unitCode address phone email'
          })
          .populate({
            path: 'serviceFollowup.serviceId',
            model: 'ChildService',
            select: 'name price member_price service_time img childDesc parentId'
          })
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        ServiceFollowup.countDocuments(search)
      ]);

      const totalPages = Math.ceil(totalDocs / limit);
      const result = {
        docs,
        totalDocs,
        limit,
        totalPages,
        page,
        pagingCounter: skip + 1,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: page < totalPages ? page + 1 : null
      };

      res.json({ statusCode: 200, data: result });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateServiceFollowup(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'ServiceFollowup ID is required' });
      }

      const serviceFollowup = await ServiceFollowup.findByIdAndUpdate(_id, req.body, { new: true });
      if (!serviceFollowup) {
        return res.status(404).json({ error: 'ServiceFollowup not found' });
      }
      res.json({ statusCode: 200, data: serviceFollowup });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteServiceFollowup(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'ServiceFollowup ID is required' });
      }
      const serviceFollowup = await ServiceFollowup.findByIdAndRemove(_id);
      if (!serviceFollowup) {
        return res.status(404).json({ error: 'ServiceFollowup not found' });
      }
      res.json({ statusCode: 200, message: 'ServiceFollowup deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getServiceFollowupById(req, res) {
    try {
      const { id } = req.params;
      const serviceFollowup = await ServiceFollowup.findById(id)
        .populate('clientId', 'name email phoneNumber gender img address customerType totalVisit unpaidAmt')
        .populate('followupBy', 'name email phoneNumber gender img roleId')
        .populate('unitId', 'unitName unitCode address phone email')
        .populate('serviceFollowup.serviceId', 'name price member_price service_time img childDesc parentId');

      if (!serviceFollowup) {
        return res.status(404).json({ error: 'ServiceFollowup not found' });
      }
      res.json({ statusCode: 200, data: serviceFollowup });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllServiceFollowups(req, res) {
    try {
      const serviceFollowups = await ServiceFollowup.find({ status: 'active' })
        .populate('clientId', 'name email phoneNumber gender img address customerType totalVisit unpaidAmt')
        .populate('followupBy', 'name email phoneNumber gender img roleId')
        .populate('unitId', 'unitName unitCode address phone email')
        .populate('serviceFollowup.serviceId', 'name price member_price service_time img childDesc parentId')
        .sort({ createdAt: -1 });
      res.json({ statusCode: 200, data: serviceFollowups });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ServiceFollowupController();
