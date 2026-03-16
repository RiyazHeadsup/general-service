const StaffReview = require('../models/StaffReview');
const Staff = require('../models/Staff');

class StaffReviewController {

  async addReview(req, res) {
    try {
      const { staffId, clientId, bookingId, rating, review, serviceId, serviceName, unitId } = req.body;

      if (!staffId) return res.status(400).json({ success: false, statusCode: 400, message: 'Staff ID is required' });
      if (!clientId) return res.status(400).json({ success: false, statusCode: 400, message: 'Client ID is required' });
      if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, statusCode: 400, message: 'Rating must be between 1 and 5' });

      // Check duplicate review for same booking
      if (bookingId) {
        const existing = await StaffReview.findOne({ staffId, clientId, bookingId });
        if (existing) {
          return res.status(409).json({ success: false, statusCode: 409, message: 'Review already exists for this booking' });
        }
      }

      const staffReview = new StaffReview({
        staffId, clientId, bookingId, rating,
        review: review || '',
        serviceId: serviceId || null,
        serviceName: serviceName || '',
        unitId: unitId || null,
      });
      await staffReview.save();

      // Update cumulative rating on Staff
      await this.recalculateStaffRating(staffId);

      const populatedReview = await StaffReview.findById(staffReview._id)
        .populate('clientId', 'name phoneNumber')
        .populate('staffId', 'name phoneNumber');

      res.json({
        success: true,
        statusCode: 201,
        message: 'Review added successfully',
        data: populatedReview
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async searchReviews(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 20,
        sort: req.body.sort || { createdAt: -1 },
        populate: [
          { path: 'clientId', select: 'name phoneNumber img' },
          { path: 'staffId', select: 'name phoneNumber profilePic' },
          { path: 'unitId', select: 'unitName' }
        ]
      };
      const result = await StaffReview.paginate(req.body.search || {}, options);
      res.json({ success: true, statusCode: 200, data: result });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async updateReview(req, res) {
    try {
      const { _id, rating, review } = req.body;
      if (!_id) return res.status(400).json({ success: false, statusCode: 400, message: 'Review ID is required' });

      const updateData = {};
      if (rating) updateData.rating = rating;
      if (review !== undefined) updateData.review = review;

      const staffReview = await StaffReview.findByIdAndUpdate(_id, updateData, { new: true });
      if (!staffReview) return res.status(404).json({ success: false, statusCode: 404, message: 'Review not found' });

      // Recalculate staff rating
      await this.recalculateStaffRating(staffReview.staffId);

      res.json({ success: true, statusCode: 200, message: 'Review updated', data: staffReview });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async deleteReview(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) return res.status(400).json({ success: false, statusCode: 400, message: 'Review ID is required' });

      const staffReview = await StaffReview.findByIdAndDelete(_id);
      if (!staffReview) return res.status(404).json({ success: false, statusCode: 404, message: 'Review not found' });

      // Recalculate staff rating
      await this.recalculateStaffRating(staffReview.staffId);

      res.json({ success: true, statusCode: 200, message: 'Review deleted' });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async getStaffRating(req, res) {
    try {
      const { staffId } = req.body;
      if (!staffId) return res.status(400).json({ success: false, statusCode: 400, message: 'Staff ID is required' });

      const staff = await Staff.findById(staffId).select('name rating');
      if (!staff) return res.status(404).json({ success: false, statusCode: 404, message: 'Staff not found' });

      res.json({ success: true, statusCode: 200, data: staff.rating });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async recalculateStaffRating(staffId) {
    try {
      const reviews = await StaffReview.find({ staffId, isActive: true });
      const count = reviews.length;

      if (count === 0) {
        await Staff.findByIdAndUpdate(staffId, {
          rating: { average: 0, total: 0, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
        });
        return;
      }

      const total = reviews.reduce((sum, r) => sum + r.rating, 0);
      const average = Math.round((total / count) * 10) / 10;
      const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach((r) => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });

      await Staff.findByIdAndUpdate(staffId, {
        rating: { average, total, count, breakdown }
      });
    } catch (error) {
      console.error('Recalculate rating error:', error);
    }
  }
}

module.exports = new StaffReviewController();
