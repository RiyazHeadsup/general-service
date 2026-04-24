const StaffAccountTransaction = require('../models/StaffAccountTransaction');

class StaffAccountTransactionController {
  async addTransaction(req, res) {
    try {
      const { staffId, type, category, amount } = req.body;

      if (!staffId) return res.status(400).json({ success: false, statusCode: 400, message: 'Staff ID is required' });
      if (!type) return res.status(400).json({ success: false, statusCode: 400, message: 'Transaction type is required' });
      if (!category) return res.status(400).json({ success: false, statusCode: 400, message: 'Category is required' });
      if (!amount || amount <= 0) return res.status(400).json({ success: false, statusCode: 400, message: 'Valid amount is required' });

      // Get last transaction for running balance
      const lastTxn = await StaffAccountTransaction.findOne({ staffId }).sort({ createdAt: -1 });
      const balanceBefore = lastTxn ? lastTxn.balanceAfter : 0;
      const balanceAfter = type === 'credit' ? balanceBefore + amount : balanceBefore - amount;

      const transaction = new StaffAccountTransaction({
        ...req.body,
        balanceBefore,
        balanceAfter,
      });
      await transaction.save();

      res.status(200).json({
        success: true,
        statusCode: 201,
        message: 'Transaction added successfully',
        data: transaction,
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async searchTransaction(req, res) {
    try {
      const options = {
        page: parseInt(req.body.page) || 1,
        limit: parseInt(req.body.limit) || 20,
        sort: req.body.sort || { createdAt: -1 },
        populate: [
          { path: 'staffId', select: 'name phoneNumber designation staffCode' },
          { path: 'unitId', select: 'unitName unitCode' },
          { path: 'createdBy', select: 'name' },
          { path: 'reference.attendanceId', select: 'dayType punchInTime punchOutTime' },
        ],
      };
      const result = await StaffAccountTransaction.paginate(req.body.search || {}, options);
      res.json({ success: true, statusCode: 200, data: result });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async updateTransaction(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) return res.status(400).json({ success: false, statusCode: 400, message: 'Transaction ID is required' });

      const transaction = await StaffAccountTransaction.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true });
      if (!transaction) return res.status(404).json({ success: false, statusCode: 404, message: 'Transaction not found' });

      res.json({ success: true, statusCode: 200, data: transaction });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async deleteTransaction(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) return res.status(400).json({ success: false, statusCode: 400, message: 'Transaction ID is required' });

      const transaction = await StaffAccountTransaction.findByIdAndDelete(_id);
      if (!transaction) return res.status(404).json({ success: false, statusCode: 404, message: 'Transaction not found' });

      res.json({ success: true, statusCode: 200, message: 'Transaction deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }

  async getStaffBalance(req, res) {
    try {
      const { staffId } = req.body;
      if (!staffId) return res.status(400).json({ success: false, statusCode: 400, message: 'Staff ID is required' });

      const lastTxn = await StaffAccountTransaction.findOne({ staffId }).sort({ createdAt: -1 });
      const balance = lastTxn ? lastTxn.balanceAfter : 0;

      // Summary
      const summary = await StaffAccountTransaction.aggregate([
        { $match: { staffId: require('mongoose').Types.ObjectId(staffId) } },
        {
          $group: {
            _id: null,
            totalCredits: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } },
            totalDebits: { $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] } },
            totalTransactions: { $sum: 1 },
          },
        },
      ]);

      res.json({
        success: true,
        statusCode: 200,
        data: {
          balance,
          totalCredits: summary[0]?.totalCredits || 0,
          totalDebits: summary[0]?.totalDebits || 0,
          totalTransactions: summary[0]?.totalTransactions || 0,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, statusCode: 500, error: error.message });
    }
  }
}

module.exports = new StaffAccountTransactionController();
