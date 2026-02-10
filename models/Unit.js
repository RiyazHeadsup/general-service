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
  }
}, { timestamps: true });

unitSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Unit', unitSchema);