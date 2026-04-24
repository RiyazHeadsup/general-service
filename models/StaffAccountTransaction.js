const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const staffAccountTransactionSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'daily_salary',
      'incentive',
      'bonus',
      'overtime',
      'advance',
      'penalty',
      'deduction',
      'late_fine',
      'absent_deduction',
      'half_day_deduction',
      'loan_recovery',
      'adjustment',
      'other'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  reference: {
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance'
    },
    billId: {
      type: String,
      trim: true
    },
    billNumber: {
      type: String,
      trim: true
    }
  },
  balanceBefore: {
    type: Number,
    default: 0
  },
  balanceAfter: {
    type: Number,
    default: 0
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  }
}, {
  timestamps: true,
  collection: 'staffAccountTransactions'
});

staffAccountTransactionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('StaffAccountTransaction', staffAccountTransactionSchema);
