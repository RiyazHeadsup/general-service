const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const kiosParentSchema = new mongoose.Schema({
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

kiosParentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('KiosParent', kiosParentSchema);
