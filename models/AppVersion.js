const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const appVersionSchema = new mongoose.Schema({
  version: { type: String, required: true, trim: true },
  buildNumber: { type: Number, required: true },
  platform: { type: String, enum: ['android', 'ios', 'both'], default: 'both' },
  releaseType: { type: String, enum: ['important', 'normal'], default: 'normal' },
  forceUpdate: { type: Boolean, default: false },
  refreshClientData: { type: Boolean, default: false },
  releaseNotes: { type: String, default: '' },
  downloadUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  releasedBy: { type: String, default: '' },
  releasedAt: { type: Date, default: Date.now },
}, { timestamps: true, collection: 'appversions' });

appVersionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('AppVersion', appVersionSchema);
