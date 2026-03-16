const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const staffLocationLogSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true,
    index: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  action: {
    type: String,
    enum: ['online', 'offline', 'location-update'],
    required: true
  },
  ip: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'staff_location_logs'
});

staffLocationLogSchema.index({ location: '2dsphere' });
staffLocationLogSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('StaffLocationLog', staffLocationLogSchema);
