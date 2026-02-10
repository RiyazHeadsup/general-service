const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const salonParentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true
  },
  img: {
    type: String,
    required: false,
    trim: true
  },
  parentDesc: {
    type: String,
    default: '',
    trim: true
  },
  unitIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  }]
}, {
  timestamps: true
});

salonParentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('SalonParent', salonParentSchema);
