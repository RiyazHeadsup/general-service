const PaymentMethod = require('../models/PaymentMethod');

class PaymentMethodController {
    async addPaymentMethod(req, res) {
        try {
            const paymentMethod = new PaymentMethod(req.body);
            await paymentMethod.save();
            res.status(200).json({
                success: true,
                message: "Payment method created successfully",
                statusCode: 201,
                data: paymentMethod
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async searchPaymentMethod(req, res) {
        try {
            const options = {
                page: parseInt(req.body.page) || 1,
                limit: parseInt(req.body.limit) || 10,
                sort: req.body.sort || { createdAt: -1 }
            };
            const paymentMethods = await PaymentMethod.paginate(req.body.search, options);
            res.json({ statusCode: 200, data: paymentMethods });
        } catch (error) {
            res.status(500).json({ statusCode: 404, error: error.message });
        }
    }

    async updatePaymentMethod(req, res) {
        try {
            const { _id } = req.body;
            if (!_id) {
                return res.status(400).json({ error: 'Payment Method ID is required' });
            }

            const paymentMethod = await PaymentMethod.findByIdAndUpdate(_id, req.body, { new: true });
            if (!paymentMethod) {
                return res.status(404).json({ error: 'Payment Method not found' });
            }
            res.json({ statusCode: 200, data: paymentMethod });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async deletePaymentMethod(req, res) {
        try {
            const { _id } = req.body;
            if (!_id) {
                return res.status(400).json({ error: 'Payment Method ID is required' });
            }
            const paymentMethod = await PaymentMethod.findByIdAndRemove(_id);
            if (!paymentMethod) {
                return res.status(404).json({ error: 'Payment Method not found' });
            }
            res.json({ statusCode: 200, message: 'Payment Method deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new PaymentMethodController();