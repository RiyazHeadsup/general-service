const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const unitSchema = new mongoose.Schema({
  unitName: {
    type: String,
    required: true,
    trim: true
  },
  unitCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  printerEnbaled: {
    type: Boolean,
    trim: true
  },printerSetting:[
    //ip name port

  ],cashDrawerEnable:{
    type: Boolean,
    trim: true
  },cashDrawerSettings:[
    //ip name port
  ],
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  rent: {
    type: Number,
    required: true
  },
  electricity: {
    type: Number,
    required: true
  },
  gst: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  priceAreInclusiveTaxes: {
    type: Boolean,
    default: true
  },
  gstPercentage: {
    type: Number,
    default: 5
  },
  lat: {
    type: Number,
    min: -90,
    max: 90
  },
  lng: {
    type: Number,
    min: -180,
    max: 180
  },
  serviceGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false
  },
  appServiceGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false
  },
  maxDiscountPercentage: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  scanAndPayDiscountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  openingTime: {
    type: String,
    trim: true,
    default: '10:00'
  },
  closingTime: {
    type: String,
    trim: true,
    default: '21:00'
  },
  appMaintenanceMode: {
    type: Boolean,
    default: false
  },
  appMaintenanceMessage: {
    type: String,
    trim: true,
    default: ''
  },

  // ── Customer app: salon profile ──
  images: [{ type: String, trim: true }],
  description: { type: String, trim: true, default: '' },
  amenities: [{ type: String, trim: true }],

  // ── Customer app: timings ──
  // One entry per weekday (0 = Sunday … 6 = Saturday). A day with no entry
  // uses openingTime/closingTime.
  weeklyTimings: [{
    _id: false,
    day: { type: Number, min: 0, max: 6, required: true },
    open: { type: String, match: HHMM },
    close: { type: String, match: HHMM },
    closed: { type: Boolean, default: false }
  }],
  // Dates the salon is shut, as YYYY-MM-DD in the salon's local time
  holidays: [{
    _id: false,
    date: { type: String, match: /^\d{4}-\d{2}-\d{2}$/, required: true },
    note: { type: String, trim: true, default: '' }
  }],

  // ── Customer app: online booking ──
  onlineBookingEnabled: { type: Boolean, default: false },
  slotInterval: { type: Number, default: 30, min: 5, max: 240 },
  cancellationWindowMins: { type: Number, default: 120, min: 0 },
  payAtSalonAllowed: { type: Boolean, default: true },

  // GeoJSON copy of lat/lng for $geoNear. Kept in sync by the hooks below;
  // write lat/lng, not this.
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number], default: undefined }
  }
}, { timestamps: true });

unitSchema.index({ location: '2dsphere' });

const hasLatLng = (lat, lng) => typeof lat === 'number' && typeof lng === 'number';
const toPoint = (lat, lng) => ({ type: 'Point', coordinates: [lng, lat] });

unitSchema.pre('save', function (next) {
  if (hasLatLng(this.lat, this.lng)) this.location = toPoint(this.lat, this.lng);
  else this.location = undefined;
  next();
});

// updateUnit uses findByIdAndUpdate, which skips save hooks. lat/lng can be
// top-level in the update or inside $set (timestamps adds a $set of its own).
unitSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate() || {};
  const $set = update.$set || {};
  const pick = (key) => (key in $set ? $set[key] : update[key]);
  const touched = ['lat', 'lng'].some(k => k in update || k in $set);
  if (!touched) return;

  const current = await this.model.findOne(this.getQuery()).select('lat lng').lean();
  const num = (v) => (v === null || v === '' || v === undefined ? undefined : Number(v));
  const lat = num('lat' in update || 'lat' in $set ? pick('lat') : current?.lat);
  const lng = num('lng' in update || 'lng' in $set ? pick('lng') : current?.lng);

  delete update.location;
  delete $set.location;
  if (hasLatLng(lat, lng) && Number.isFinite(lat) && Number.isFinite(lng)) {
    update.$set = { ...$set, location: toPoint(lat, lng) };
  } else {
    update.$unset = { ...(update.$unset || {}), location: 1 };
  }
  this.setUpdate(update);
});

// Fill location for units saved before it existed (or written outside these
// hooks). Idempotent; run at startup.
unitSchema.statics.syncLocations = function () {
  return this.updateMany(
    { lat: { $type: 'number' }, lng: { $type: 'number' }, $or: [{ location: { $exists: false } }, { 'location.coordinates': { $size: 0 } }] },
    [{ $set: { location: { type: 'Point', coordinates: ['$lng', '$lat'] } } }]
  );
};

unitSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Unit', unitSchema);
