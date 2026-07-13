// routes/artistRoutes.js
import express from 'express';
import Artist from '../models/Artist.js';
import Artwork from '../models/Artwork.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const router = express.Router();

// @desc    Get all artists
// @route   GET /api/artists
router.get('/', async (req, res) => {
  try {
    const { search, specialty, limit = 20 } = req.query;
    let query = {};
    
    if (search) {
      const safeSearch = escapeRegex(search.trim());
      const users = await User.find({
        name: { $regex: safeSearch, $options: 'i' },
        role: 'artist'
      }).select('_id');
      query.user = { $in: users.map((u) => u._id) };
    }
    
    if (specialty) {
      query.specialties = specialty;
    }
    
    const artists = await Artist.find(query)
      .populate('user', 'name email profilePicture location bio followers following')
      .sort('-createdAt')
      .limit(parseInt(limit));
    
    res.json({ success: true, count: artists.length, data: artists });
  } catch (error) {
    console.error('GET /artists error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single artist profile
// @route   GET /api/artists/:id
router.get('/:id', async (req, res) => {
  try {
    let artist = await Artist.findById(req.params.id)
  .populate('user', 'name email profilePicture location bio followers following');

// Fallback: if the provided ID is actually a User ID,
// find the Artist document that belongs to that user.
if (!artist) {
  artist = await Artist.findOne({ user: req.params.id })
    .populate('user', 'name email profilePicture location bio followers following');
}

if (!artist) {
  return res.status(404).json({
    success: false,
    message: 'Artist not found'
  });
}
    
    const artworks = await Artwork.find({ 
      artist: artist.user._id, 
      isPublic: true 
    }).sort('-createdAt').limit(20);
    
    // Get follower/following counts from the User model
    const followersCount = artist.user.followers?.length || 0;
    const followingCount = artist.user.following?.length || 0;
    
    res.json({ 
      success: true, 
      data: {
        artist,
        artworks,
        stats: { 
          followersCount, 
          followingCount 
        }
      }
    });
  } catch (error) {
    console.error('GET /artists/:id error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create or update artist profile
// @route   PUT /api/artists/profile
router.put('/profile', protect, async (req, res) => {
  try {
    if (req.user.role !== 'artist' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only artists can update artist profiles' 
      });
    }
    
    let artist = await Artist.findOne({ user: req.user._id });
    
    if (!artist) {
      // Create new artist profile
      artist = await Artist.create({
        user: req.user._id,
        ...req.body
      });
      
      // Update user role to artist
      await User.findByIdAndUpdate(req.user._id, { 
        role: 'artist',
        isArtist: true,
        becameArtistAt: new Date()
      });
    } else {
      // Update existing profile
      Object.assign(artist, req.body);
      await artist.save();
    }
    
    res.json({ 
      success: true, 
      message: 'Artist profile updated successfully',
      data: artist 
    });
  } catch (error) {
    console.error('PUT /artists/profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// @desc    Get artist's artworks
// @route   GET /api/artists/:id/artworks
router.get('/:id/artworks', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    
    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist not found' });
    }
    
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const artworks = await Artwork.find({ 
      artist: artist.user, 
      isPublic: true 
    })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Artwork.countDocuments({ artist: artist.user, isPublic: true });
    
    res.json({ 
      success: true, 
      data: artworks,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GET /artists/:id/artworks error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;