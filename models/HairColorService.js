const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const pricingSchema = new mongoose.Schema({
  short: {
    type: Number,
    required: false,
    default: 0
  },
  medium: {
    type: Number,
    required: false,
    default: 0
  },
  long: {
    type: Number,
    required: false,
    default: 0
  }
}, { _id: false });

const ratioSchema = new mongoose.Schema({
  colorName: {
    type: String,
    required: false,
    trim: true
  },
  percentage: {
    type: Number,
    required: false,
    min: 0,
    max: 100
  }
}, { _id: false });

const hairColorServiceSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  img: {
    type: String,
    default: '',
    trim: true
  },
  category: {
    type: String,
    enum: ['single_color', 'double_color'],
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Unisex'],
    required: false,
    default: 'Unisex'
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  pricing: {
    type: pricingSchema,
    required: false,
    default: () => ({})
  },
  isActive: {
    type: Boolean,
    default: true
  },
  ratios: {
    type: [ratioSchema],
    required: false,
    default: []
  },
  unitIds: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: false
  }
}, {
  timestamps: true
});

hairColorServiceSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('HairColorService', hairColorServiceSchema);
