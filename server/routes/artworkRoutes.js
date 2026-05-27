import express from 'express';
import Artwork from '../models/Artwork.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { body, validationResult } from 'express-validator';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// @desc    Get all artworks
// @route   GET /api/artworks
router.get('/', async (req, res) => {
  try {
    const { category, featured, limit = 20 } = req.query;
    let query = {};

    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;

    const artworks = await Artwork.find(query)
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.json({ success: true, count: artworks.length, data: artworks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single artwork
// @route   GET /api/artworks/:id
router.get('/:id', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }
    
    res.json({ success: true, data: artwork });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create new artwork
// @route   POST /api/artworks
router.post(
  '/',
  protect,
  upload.single('image'),
  [
    body('title').notEmpty().trim(),
    body('description').notEmpty(),
    body('category').isIn(['paintings', 'sketches', 'digital', 'watercolors', 'mixed-media']),
    body('dimensions').notEmpty(),
    body('medium').notEmpty(),
    body('yearCreated').isInt({ min: 1900, max: new Date().getFullYear() })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload an image' });
      }

      const artworkData = {
        ...req.body,
        imageUrl: req.file.path,
        cloudinaryId: req.file.filename
      };

      const artwork = await Artwork.create(artworkData);
      res.status(201).json({ success: true, data: artwork });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @desc    Update artwork
// @route   PUT /api/artworks/:id
router.put('/:id', protect, async (req, res) => {
  try {
    let artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }

    artwork = await Artwork.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: artwork });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete artwork
// @route   DELETE /api/artworks/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({ success: false, message: 'Artwork not found' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(artwork.cloudinaryId);
    
    await artwork.deleteOne();

    res.json({ success: true, message: 'Artwork removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;