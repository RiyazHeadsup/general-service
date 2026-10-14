const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// OTA JS bundles for the React Native apps. Ported from the old backend's
// app-control-service; same collection name and fields.
const otaUpdateSchema = new mongoose.Schema({
  version: { type: String, required: true, trim: true },
  buildNumber: { type: Number, required: true },
  platform: { type: String, enum: ['android', 'ios', 'both'], default: 'both' },
  app: { type: String, enum: ['partner', 'client'], default: 'partner' },
  bundleUrl: { type: String, required: true },
  // Firebase Storage object path, used to delete the bundle
  storagePath: { type: String, default: '' },
  releaseNotes: { type: String, default: '' },
  forceUpdate: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  releasedBy: { type: String, default: '' },
  releasedAt: { type: Date, default: Date.now },
}, { timestamps: true, collection: 'otaupdates' });

otaUpdateSchema.index({ app: 1, platform: 1, isActive: 1, buildNumber: -1 });
otaUpdateSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('OtaUpdate', otaUpdateSchema);
