const Order = require('../models/Order');

class OrderController {
  async createOrder(req, res) {
    try {
      const order = new Order(req.body);
      await order.save();
      res.status(200).json({
        success: true,
        message: "order created successfully",
        statusCode: 201,
        data: order
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchOrder(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'vendorId', select: 'vendorName contact email' },
          { path: 'unitIds', select: 'unitName unitCode' }
        ]
      };
      const orders = await Order.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: orders });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateOrder(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Order ID is required' });
      }
      
      const order = await Order.findByIdAndUpdate(_id, req.body, { new: true });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json({ statusCode: 200, data: order });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteOrder(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Order ID is required' });
      }
      const order = await Order.findByIdAndRemove(_id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json({ statusCode: 200, message: 'Order deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new OrderController();