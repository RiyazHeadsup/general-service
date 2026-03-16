const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const staffReviewSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true,
    default: ''
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  serviceName: {
    type: String,
    trim: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'staffreviews'
});

staffReviewSchema.index({ staffId: 1, createdAt: -1 });
staffReviewSchema.index({ staffId: 1, clientId: 1, bookingId: 1 }, { unique: true });

staffReviewSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('StaffReview', staffReviewSchema);
