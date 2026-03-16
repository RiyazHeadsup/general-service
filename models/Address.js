const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const addressSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  label: {
    type: String,
    default: 'Home',
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  landmark: {
    type: String,
    trim: true
  },
  lat: {
    type: Number
  },
  lng: {
    type: Number
  },
  isActive: {
    type: Boolean,
    default: false
  },
  phoneNumber: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'addresses'
});

addressSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Address', addressSchema);
