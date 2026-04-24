const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  staffCode: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    trim: true,
    default: 'Employee'
  },
  dob: {
    type: String,
    trim: true
  },
  dateOfJoining: {
    type: String,
    trim: true
  },
  salary: {
    type: String,
    trim: true
  },
  workingHoursPerDay: {
    type: String,
    trim: true,
    default: '9'
  },
  weekOff: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  loginUsername: {
    type: String,
    trim: true
  },
  loginPassword: {
    type: String,
    trim: true
  },
  img: {
    type: String,
    trim: true
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  },
  unitIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  }],
  experience: {
    type: String,
    trim: true
  },
  specialisation: [{
    type: String,
    trim: true
  }],
  lastWorkingLocation: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  policeVerification: {
    type: String,
    trim: true
  },
  addressProof: {
    type: String,
    trim: true
  },
  height: {
    type: String,
    trim: true
  },
  weight: {
    type: String,
    trim: true
  },
  bodyDimension: {
    type: String,
    trim: true
  },
  clothSize: {
    type: String,
    trim: true
  },
  colorComplexion: {
    type: String,
    trim: true
  },
  profilePic: {
    type: String,
    trim: true
  },
  additionalPhotos: [{
    type: String,
    trim: true
  }],
  knownDiseases: {
    type: String,
    trim: true
  },
  maritalStatus: {
    type: String,
    trim: true
  },
  kids: {
    type: String,
    trim: true
  },
  monthlyIncome: {
    type: String,
    trim: true
  },
  familyIncome: {
    type: String,
    trim: true
  },
  foodPreference: {
    type: String,
    trim: true
  },
  speakingSkill: {
    type: String,
    trim: true
  },
  angerIssues: {
    type: String,
    trim: true
  },
  hygiene: {
    type: String,
    trim: true
  },
  hasToolKit: {
    type: Boolean,
    default: false
  },
  bankDetails: {
    accountHolderName: { type: String, trim: true, default: '' },
    accountNumber: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    ifscCode: { type: String, trim: true, uppercase: true, default: '' },
    branchName: { type: String, trim: true, default: '' },
    upiId: { type: String, trim: true, default: '' },
    panNumber: { type: String, trim: true, uppercase: true, default: '' },
    aadharNumber: { type: String, trim: true, default: '' }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  lastLocationUpdate: {
    type: Date
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    average: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    breakdown: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  incomePercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isStaffDetailsReceived: {
    type: Boolean,
    default: false
  },
  isPartnerBlocked: {
    type: Boolean,
    default: false
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  blockedAt: {
    type: Date,
    default: null
  },
  workingWindows: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    slots: [{
      start: { type: String, required: true },
      end: { type: String, required: true }
    }]
  }],
  jwtToken: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'staffs'
});

staffSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Staff', staffSchema);
