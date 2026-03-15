const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const feedbackSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  service: {
    type: String,
    required: true,
    trim: true
  },
  serviceRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'feedbacks'
});

feedbackSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Feedback', feedbackSchema);
