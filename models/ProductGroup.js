const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const productGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  img: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  unitIds: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: false
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

productGroupSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ProductGroup', productGroupSchema);
