const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const configProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  image: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

configProjectSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ConfigProject', configProjectSchema);
