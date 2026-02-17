const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  img: {
    type: String,
    trim: true
  },
  unitIds: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'groups'
});

groupSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Group', groupSchema);
