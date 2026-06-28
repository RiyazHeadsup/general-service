const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

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
  }
}, { timestamps: true });

unitSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Unit', unitSchema);
