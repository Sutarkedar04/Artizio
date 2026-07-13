import mongoose from 'mongoose';

const artworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['paintings', 'sketches', 'digital', 'watercolors', 'mixed-media', 'sculpture', 'photography']
  },
  imageUrl: {
    type: String,
    required: [true, 'Please add an image URL']
  },
  cloudinaryId: {
    type: String,
    required: true
  },
  dimensions: {
    type: String,
    default: ''
  },
  medium: {
    type: String,
    default: ''
  },
  yearCreated: {
    type: Number,
    default: new Date().getFullYear()
  },
  
  // New fields for community platform
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    type: Number,
    default: 0
  },
  isForSale: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
  }],
  views: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

artworkSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for search
// In Artwork.js - Add these indexes
artworkSchema.index({ title: 'text', description: 'text', tags: 'text' });
artworkSchema.index({ artist: 1, createdAt: -1 });
artworkSchema.index({ category: 1, isPublic: 1 });
artworkSchema.index({ isFeatured: 1, isPublic: 1 });

export default mongoose.model('Artwork', artworkSchema);