const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const IntervalStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  MISSED: 'missed'
};

const taskIntervalSchema = new mongoose.Schema({
  start: {
    type: Number
  },
  end: {
    type: Number
  },
  status: {
    type: String,
    enum: Object.values(IntervalStatus),
    default: IntervalStatus.PENDING
  },
  interval: {
    type: String,
    trim: true
  },
  taskEvidenceUrl: {
    type: String,
    trim: true
  }
}, { _id: false });

const taskSchema = new mongoose.Schema({
  taskName: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    trim: true
  },
  taskFrequency: {
    type: String,
    trim: true
  },
  scheduleType: {
    type: String,
    trim: true
  },
  scheduledDateTime: {
    type: Number,
    default: null
  },
  startDateTime: {
    type: Number,
    default: null
  },
  endDateTime: {
    type: Number,
    default: null
  },
  taskIntervals: {
    type: [taskIntervalSchema],
    default: []
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'roles'
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  unitIds: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  },
  status: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  upDatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  weekDays: [{
    type: String
  }],
  weekDaysForMonthly: [{
    type: Number
  }],
  monthWeeks: [{
    type: Number
  }],
  createdAt: {
    type: Number
  },
  updatedAt: {
    type: Number
  },
  taskcreatedformonth: {
    type: Number,
    default: null
  },
  isCommon: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: false
});

taskSchema.plugin(mongoosePaginate);

module.exports = {
  Task: mongoose.model('Task', taskSchema),
  IntervalStatus
};