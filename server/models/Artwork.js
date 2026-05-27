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
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['paintings', 'sketches', 'digital', 'watercolors', 'mixed-media']
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
    required: [true, 'Please add dimensions']
  },
  medium: {
    type: String,
    required: [true, 'Please add medium used']
  },
  yearCreated: {
    type: Number,
    required: [true, 'Please add year created']
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Artwork', artworkSchema);