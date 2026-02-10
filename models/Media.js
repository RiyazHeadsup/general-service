const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const mediaSchema = new mongoose.Schema(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
      description: 'Associated device ID'
    },
    duration: {
      type: Number,
      required: true,
      description: 'Duration in seconds'
    },
    type: {
      type: String,
      required: true,
      enum: ['image', 'video'],
      description: 'Media type'
    },
    orientation: {
      type: String,
      required: false,
      enum: ['horizontal', 'vertical'],
      description: 'Media orientation'
    },
    source: {
      type: String,
      required: true,
      description: 'Media source URL'
    },
    isActive: {
      type: Boolean,
      default: true,
      description: 'Active status of media'
    },
    unitIds: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
      description: 'Associated unit ID'
    },
    uniqueViewCount: {
      type: Number,
      default: 0,
      description: 'Number of unique devices that viewed this ad'
    },
    lastViewedAt: {
      type: Date,
      default: null,
      description: 'Last time media was viewed'
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

mediaSchema.plugin(mongoosePaginate);

mediaSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

mediaSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;
