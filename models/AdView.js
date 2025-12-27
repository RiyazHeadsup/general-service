const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const adViewSchema = new mongoose.Schema(
  {
    mediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      required: true,
      description: 'Media/Ad ID being viewed'
    },
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
      description: 'Device ID that viewed the ad'
    },
    viewCount: {
      type: Number,
      default: 1,
      description: 'Number of times this device viewed this ad'
    },
    firstViewedAt: {
      type: Date,
      default: Date.now,
      description: 'First time this device viewed this ad'
    },
    lastViewedAt: {
      type: Date,
      default: Date.now,
      description: 'Last time this device viewed this ad'
    },
    createdAt: {
      type: Number,
      default: () => Date.now()
    },
    updatedAt: {
      type: Number,
      default: () => Date.now()
    }
  },
  {
    timestamps: false
  }
);

// Compound unique index - one record per device per ad
adViewSchema.index({ mediaId: 1, deviceId: 1 }, { unique: true });

adViewSchema.plugin(mongoosePaginate);

adViewSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

adViewSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const AdView = mongoose.model('AdView', adViewSchema);

module.exports = AdView;
