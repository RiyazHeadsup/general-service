const Product = require('../models/Product');

class ProductController {
  async createProduct(req, res) {
    try {
      const product = new Product(req.body);
      await product.save();
      res.status(200).json({
        success: true,
        message: "product created successfully",
        statusCode: 201,
        data: product
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchProduct(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 10,
        sort: req.body.sort || { createdAt: -1 },
        populate: req.body.populate || [
          { path: 'unitIds', select: 'unitName unitCode' }
        ]
      };
      const products = await Product.paginate(req.body.search, options);
      res.json({ statusCode: 200, data: products });
    } catch (error) {
      res.status(500).json({ statusCode: 404, error: error.message });
    }
  }

  async updateProduct(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }
      
      const product = await Product.findByIdAndUpdate(_id, req.body, { new: true });
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ statusCode: 200, data: product });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }
      const product = await Product.findByIdAndRemove(_id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ statusCode: 200, message: 'Product deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ProductController();