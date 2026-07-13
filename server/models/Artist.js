// models/Artist.js
import mongoose from 'mongoose';

const artistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot be more than 1000 characters']
  },
  profileBanner: {
    type: String,
    default: ''
  },
  socialLinks: {
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    facebook: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  specialties: [{
    type: String,
    enum: ['Painting', 'Drawing', 'Digital Art', 'Sculpture', 'Photography', 
           'Mixed Media', 'Watercolor', 'Oil Painting', 'Portrait', 'Landscape', 
           'Abstract', 'Realism', 'Impressionism', 'Surrealism', 'Minimalism']
  }],
  totalSales: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  commissionEnabled: {
    type: Boolean,
    default: true
  },
  commissionPrice: {
    type: Number,
    default: null
  },
  commissionDescription: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
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

artistSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add index for search
artistSchema.index({ specialties: 1, 'user': 1 });

export default mongoose.model('Artist', artistSchema);