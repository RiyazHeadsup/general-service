const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const configProjectSchema = new mongoose.Schema({
  unitIds: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Unique name per unit
configProjectSchema.index({ unitIds: 1, name: 1 }, { unique: true });

// Index for querying projects by unit
configProjectSchema.index({ unitIds: 1, isActive: 1 });

configProjectSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ConfigProject', configProjectSchema);
