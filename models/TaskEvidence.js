const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// Task Interval sub-schema
const taskIntervalSchema = new mongoose.Schema({
    start: {
        type: Number,
        required: true
    },
    end: {
        type: Number,
        required: true
    },
    interval: {
        type: String,
        trim: true
    },
    submittedBy: {
        type: String,
        trim: true
    },
    taskEvidenceUrl: {
        type: String,
        trim: true
    },
    remarks: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'missed'],
        default: 'pending'
    }
}, { _id: false });

// Main TaskEvidence schema
const taskEvidenceSchema = new mongoose.Schema({
    // Reference to original task
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
        index: true
    },

    // Basic Information
    taskName: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        trim: true,
        required: true
    },

    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },

    // Scheduling Information
    taskFrequency: {
        type: String,
        enum: ['once', 'daily', 'weekly', 'monthly'],
        required: true,
        index: true
    },

    scheduleType: {
        type: String,
        enum: ['once', 'daily', 'weekly', 'monthly']
    },

    // Universal Schedule Fields
    scheduledDateTime: {
        type: Number
    },

    startDateTime: {
        type: Number
    },

    endDateTime: {
        type: Number
    },

    // Time Intervals
    taskIntervals: {
        type: [taskIntervalSchema],
        default: []
    },

    // Weekly Configuration
    weekDays: {
        type: [String],
        default: []
    },

    // Monthly Configuration
    weekDaysForMonthly: {
        type: [Number],
        default: []
    },

    monthWeeks: {
        type: [Number],
        default: []
    },

    // Assignment Information
    roleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true,
        index: true
    },

    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: [],
        required: true,
        index: true
    }],


    // System Information
    unitIds: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit'
    },

    status: {
        type: String,
        enum: ['active', 'pending', 'in-progress', 'completed', 'missed', 'paused', 'cancelled'],
        default: 'pending',
        index: true
    },

    // Legacy fields (for backward compatibility)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    evidenceUrl: {
        type: String,
        trim: true
    },

    location: {
        type: String,
        trim: true
    },

    submittedAt: {
        type: Number,
        default: () => Date.now()
    },

    // Timestamps
    createdAt: {
        type: Number,
        default: () => Date.now()
    },

    updatedAt: {
        type: Number,
        default: () => Date.now()
    }
},
);







taskEvidenceSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('TaskEvidence', taskEvidenceSchema);
