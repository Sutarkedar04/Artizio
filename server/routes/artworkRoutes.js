import express from 'express';
import Artwork from '../models/Artwork.js';
import upload from '../middleware/upload.js';
import { body, validationResult } from 'express-validator';
import cloudinary from '../config/cloudinary.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// ============================================
// SPECIFIC ROUTES (MUST COME FIRST)
// ============================================

// @desc    Get artist's own artworks (for their dashboard)
// @route   GET /api/artworks/my-artworks
router.get('/my-artworks', protect, async (req, res) => {
  try {
    console.log(`Fetching artworks for user: ${req.user._id}`);
    
    const artworks = await Artwork.find({ artist: req.user._id })
      .populate('artist', 'name email profilePicture')
      .sort('-createdAt');
    
    console.log(`Found ${artworks.length} artworks`);
    
    res.json({ 
      success: true, 
      count: artworks.length, 
      data: artworks 
    });
  } catch (error) {
    console.error('GET /my-artworks error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @desc    Search artworks
// @route   GET /api/artworks/search
router.get('/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, sort = 'newest' } = req.query;
    
    let query = { isPublic: true };
    
    if (q) {
      query.$text = { $search: q };
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }
    
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { likes: -1 };
        break;
      case 'price-low':
        sortOption = { price: 1 };
        break;
      case 'price-high':
        sortOption = { price: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
    
    const artworks = await Artwork.find(query)
      .populate('artist', 'name profilePicture')
      .sort(sortOption)
      .limit(50);
    
    res.json({ 
      success: true, 
      count: artworks.length, 
      data: artworks 
    });
  } catch (error) {
    console.error('GET /artworks/search error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @desc    Get featured artworks
// @route   GET /api/artworks/featured
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const artworks = await Artwork.find({ 
      isFeatured: true, 
      isPublic: true 
    })
      .populate('artist', 'name profilePicture')
      .sort('-createdAt')
      .limit(parseInt(limit));
    
    res.json({ 
      success: true, 
      count: artworks.length, 
      data: artworks 
    });
  } catch (error) {
    console.error('GET /artworks/featured error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @desc    Get artworks by artist
// @route   GET /api/artworks/artist/:artistId
router.get('/artist/:artistId', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const artworks = await Artwork.find({ 
      artist: req.params.artistId,
      isPublic: true 
    })
      .populate('artist', 'name email profilePicture')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Artwork.countDocuments({ 
      artist: req.params.artistId,
      isPublic: true 
    });

    res.json({ 
      success: true, 
      count: artworks.length,
      total: total,
      data: artworks 
    });
  } catch (error) {
    console.error('GET /artworks/artist/:artistId error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ============================================
// DYNAMIC ROUTES (WITH :id PARAM)
// ============================================

// @desc    Get all artworks (public artworks for everyone; all artworks for admin)
// @route   GET /api/artworks
router.get('/', async (req, res) => {
  try {
    const { category, featured, limit = 20, page = 1 } = req.query;
    let query = {};

    // Only admins get to see hidden/unpublished artworks.
    // We check for a bearer token manually here since this route must stay
    // public for logged-out visitors — we can't use `protect` (which requires auth).
    let requesterIsAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const User = (await import('../models/User.js')).default;
        const requester = await User.findById(decoded.id).select('role');
        requesterIsAdmin = requester?.role === 'admin';
      } catch {
        // invalid/expired token — just treat as a logged-out visitor
      }
    }

    if (!requesterIsAdmin) {
      query.isPublic = true;
    }

    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const artworks = await Artwork.find(query)
      .populate('artist', 'name email profilePicture bio location')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Artwork.countDocuments(query);

    res.json({ 
      success: true, 
      count: artworks.length, 
      total: total,
      data: artworks 
    });
  } catch (error) {
    console.error('GET /artworks error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single artwork
// @route   GET /api/artworks/:id
router.get('/:id', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate('artist', 'name email profilePicture bio location');
    
    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }
    
    // Increment view count
    artwork.views += 1;
    await artwork.save();
    
    res.json({ success: true, data: artwork });
  } catch (error) {
    console.error('GET /artworks/:id error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create artwork (artist only)
// @route   POST /api/artworks
router.post('/', protect, upload.single('image'), [
  body('title').notEmpty().withMessage('Title is required').trim(),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').isIn(['paintings', 'sketches', 'digital', 'watercolors', 'mixed-media', 'sculpture', 'photography'])
    .withMessage('Invalid category')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please upload an image' 
      });
    }

    // Check if user is artist or admin
    if (req.user.role !== 'artist' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only artists can upload artworks' 
      });
    }

    const artworkData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      dimensions: req.body.dimensions || '',
      medium: req.body.medium || '',
      yearCreated: req.body.yearCreated || new Date().getFullYear(),
      price: req.body.price || 0,
      isForSale: req.body.isForSale === 'true' || req.body.isForSale === true,
      // isFeatured is admin-only — never trust it from the create payload,
      // regardless of role. Featuring happens via the dedicated PATCH /:id/feature route.
      isFeatured: false,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      artist: req.user._id,
      imageUrl: req.file.path,
      cloudinaryId: req.file.filename,
      isPublic: true
    };

    console.log('Creating artwork with data:', artworkData);

    const artwork = await Artwork.create(artworkData);
    
    // Populate the artist field for response
    const populatedArtwork = await Artwork.findById(artwork._id)
      .populate('artist', 'name email profilePicture');
    
    res.status(201).json({ 
      success: true, 
      message: 'Artwork created successfully',
      data: populatedArtwork 
    });
  } catch (error) {
    console.error('POST /artworks error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @desc    Update artwork
// @route   PUT /api/artworks/:id
router.put('/:id', protect, async (req, res) => {
  try {
    let artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({ 
        success: false, 
        message: 'Artwork not found' 
      });
    }

    // Check authorization
    if (artwork.artist.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this artwork' 
      });
    }

    // Update fields
    // Update fields — isFeatured is deliberately excluded here.
    // It can only be changed via PATCH /:id/feature (admin-only, below).
    const allowedUpdates = ['title', 'description', 'category', 'dimensions', 'medium','yearCreated', 'price', 'isForSale', 'tags', 'isPublic'];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        artwork[field] = req.body[field];
      }
    });

    artwork.updatedAt = Date.now();
    await artwork.save();

    const updatedArtwork = await Artwork.findById(artwork._id)
      .populate('artist', 'name email profilePicture');

    res.json({ 
      success: true, 
      message: 'Artwork updated successfully',
      data: updatedArtwork 
    });
  } catch (error) {
    console.error('PUT /artworks/:id error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @desc    Delete artwork
// @route   DELETE /api/artworks/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({ 
        success: false, 
        message: 'Artwork not found' 
      });
    }

    // Check authorization
    if (artwork.artist.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this artwork' 
      });
    }

    // Delete from Cloudinary
    try {
      if (artwork.cloudinaryId) {
        await cloudinary.uploader.destroy(artwork.cloudinaryId);
        console.log('Deleted from Cloudinary:', artwork.cloudinaryId);
      }
    } catch (cloudinaryError) {
      console.error('Cloudinary delete error:', cloudinaryError);
      // Continue with deletion even if Cloudinary fails
    }

    await artwork.deleteOne();
    
    res.json({ 
      success: true, 
      message: 'Artwork removed successfully' 
    });
  } catch (error) {
    console.error('DELETE /artworks/:id error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @desc    Update artwork view count
// @route   PUT /api/artworks/:id/view
router.put('/:id/view', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (artwork) {
      artwork.views += 1;
      await artwork.save();
    }
    res.json({ success: true });
  } catch (error) {
    console.error('PUT /artworks/:id/view error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});
// @desc    Toggle featured status (admin only)
// @route   PATCH /api/artworks/:id/feature
router.patch('/:id/feature', protect, requireAdmin, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    artwork.isFeatured = req.body.isFeatured === true || req.body.isFeatured === 'true';
    await artwork.save();

    const updatedArtwork = await Artwork.findById(artwork._id)
      .populate('artist', 'name email profilePicture');

    res.json({
      success: true,
      message: `Artwork ${artwork.isFeatured ? 'marked as' : 'removed from'} featured`,
      data: updatedArtwork
    });
  } catch (error) {
    console.error('PATCH /artworks/:id/feature error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Toggle like on artwork
// @route   POST /api/artworks/:id/like
router.post('/:id/like', protect, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({ 
        success: false, 
        message: 'Artwork not found' 
      });
    }

    const userId = req.user._id;
    const hasLiked = artwork.likes.includes(userId);

    if (hasLiked) {
      artwork.likes = artwork.likes.filter(id => id.toString() !== userId.toString());
    } else {
      artwork.likes.push(userId);
    }

    await artwork.save();

    res.json({ 
      success: true, 
      liked: !hasLiked,
      likesCount: artwork.likes.length 
    });
  } catch (error) {
    console.error('POST /artworks/:id/like error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @desc    Add comment to artwork
// @route   POST /api/artworks/:id/comment
router.post('/:id/comment', protect, [
  body('text').notEmpty().withMessage('Comment text is required').trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({ 
        success: false, 
        message: 'Artwork not found' 
      });
    }

    artwork.comments.push({
      user: req.user._id,
      text: req.body.text.trim()
    });

    await artwork.save();

    const updatedArtwork = await Artwork.findById(req.params.id)
      .populate('comments.user', 'name profilePicture');

    res.json({ 
      success: true, 
      message: 'Comment added successfully',
      data: updatedArtwork.comments 
    });
  } catch (error) {
    console.error('POST /artworks/:id/comment error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @desc    Delete comment from artwork
// @route   DELETE /api/artworks/:id/comment/:commentId
router.delete('/:id/comment/:commentId', protect, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({ 
        success: false, 
        message: 'Artwork not found' 
      });
    }

    const comment = artwork.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Comment not found' 
      });
    }

    // Check if user is comment owner, artwork owner, or admin
    if (comment.user.toString() !== req.user._id.toString() && 
        artwork.artist.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this comment' 
      });
    }

    comment.deleteOne();
    await artwork.save();

    res.json({ 
      success: true, 
      message: 'Comment deleted successfully' 
    });
  } catch (error) {
    console.error('DELETE /artworks/:id/comment/:commentId error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router;