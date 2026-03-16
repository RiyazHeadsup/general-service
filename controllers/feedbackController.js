const Feedback = require('../models/Feedback');

class FeedbackController {
  async addFeedback(req, res) {
    try {
      const feedback = new Feedback(req.body);
      await feedback.save();
      res.status(200).json({
        success: true,
        message: "Feedback submitted successfully",
        statusCode: 201,
        data: feedback
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async searchFeedback(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || []
      };
      const result = await Feedback.paginate(req.body.search || {}, options);
      res.json({ success: true, statusCode: 200, data: result });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async deleteFeedback(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Feedback ID is required' });
      }
      const feedback = await Feedback.findByIdAndRemove(_id);
      if (!feedback) {
        return res.status(404).json({ error: 'Feedback not found' });
      }
      res.json({ statusCode: 200, message: 'Feedback deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new FeedbackController();
