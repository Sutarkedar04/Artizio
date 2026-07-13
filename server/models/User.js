// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true
  },
  mobileNumber: {
    type: String,
    required: [true, 'Please add a mobile number'],
    match: [/^[0-9]{10}$/, 'Please add a valid 10-digit mobile number']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'artist', 'admin'],
    default: 'user'
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  location: {
    type: String
  },
  // Email verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: ''
  },
  verificationExpire: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: ''
  },
  resetPasswordExpire: {
    type: Date,
    default: null
  },
  // FOLLOWERS - MOVED TO USER (Instagram style)
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Track user's artist status
  isArtist: {
    type: Boolean,
    default: false
  },
  becameArtistAt: {
    type: Date,
    default: null
  },
  accountType: {
    type: String,
    enum: ['user', 'artist', 'creator'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.updatedAt = Date.now();
  
  // Update isArtist flag based on role
  this.isArtist = this.role === 'artist';
  if (this.isArtist && !this.becameArtistAt) {
    this.becameArtistAt = new Date();
  }
  
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ mobileNumber: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });

export default mongoose.model('User', userSchema);