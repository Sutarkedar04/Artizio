import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import Commission from '../models/Commission.js';
import { protect } from '../middleware/auth.js';
import Artist from '../models/Artist.js';

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'commissions',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const VALID_STATUSES = ['pending', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled'];

// @desc    Get all commission requests (admin only)
// @route   GET /api/commissions
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const commissions = await Commission.find({})
      .populate('requester', 'name email mobileNumber location')
      .populate('artist', 'name email profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: commissions.length,
      data: commissions
    });
  } catch (error) {
    console.error('GET /commissions error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// @desc    Get user's own commission requests
// @route   GET /api/commissions/my-requests
router.get('/my-requests', protect, async (req, res) => {
  try {
    const commissions = await Commission.find({ requester: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: commissions.length,
      data: commissions
    });
  } catch (error) {
    console.error('GET /my-requests error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get commissions for artist (artist only)
// @route   GET /api/commissions/artist-commissions
router.get('/artist-commissions', protect, async (req, res) => {
  try {
    if (req.user.role !== 'artist' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Artists only.'
      });
    }

    const commissions = await Commission.find({ artist: req.user._id })
      .populate('requester', 'name email mobileNumber')
      .sort('-createdAt');

    res.json({ success: true, count: commissions.length, data: commissions });
  } catch (error) {
    console.error('GET /artist-commissions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Submit commission request
// @route   POST /api/commissions
router.post('/', protect, upload.single('referenceImage'), async (req, res) => {
  try {
    const { artist, artistName, description, dimensions, deadline, budget,currency } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    if (!artist) {
      return res.status(400).json({
        success: false,
        message: 'Artist is required'
      });
    }

    // Resolve either an Artist document ID or a User ID
    const artistDoc = await Artist.findOne({
      $or: [
        { _id: artist },
        { user: artist }
      ]
    }).catch(() => null);

    if (!artistDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid artist'
      });
    }

    const commissionData = {
      requester: req.user._id,
      // Always store the artist's User ID
      artist: artistDoc.user,
      artistName,
      requesterName: req.user.name,
      requesterEmail: req.user.email,
      requesterMobile: req.user.mobileNumber || '',
      description,
      dimensions: dimensions || '',
      deadline: deadline || null,
      budget: budget ? Number(budget) : null,
      currency: currency || 'INR',
      status: 'pending'
    };

    if (req.file) {
      commissionData.referenceImageUrl = req.file.path;
      commissionData.referenceCloudinaryId = req.file.filename;
    }

    const commission = await Commission.create(commissionData);

    res.status(201).json({
      success: true,
      message: `Commission request sent to ${artistName} successfully!`,
      data: commission
    });
  } catch (error) {
    console.error('POST /commissions error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update commission status (admin only)
// @route   PUT /api/commissions/:id
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;
    const { status, statusNotes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const commission = await Commission.findById(id);

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }

    commission.status = status;
    if (statusNotes !== undefined) {
      commission.statusNotes = statusNotes;
    }

    // Stamp completion date the first time a commission is marked completed
    if (status === 'completed' && !commission.completionDate) {
      commission.completionDate = Date.now();
    }

    await commission.save();

    res.json({
      success: true,
      message: `Commission ${status} successfully`,
      data: commission
    });
  } catch (error) {
    console.error('PUT /commissions error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// @desc    Update commission status (artist)
// @route   PUT /api/commissions/:id/artist-status
router.put('/:id/artist-status', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, agreedPrice, statusNotes } = req.body;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const commission = await Commission.findById(id);

    if (!commission) {
      return res.status(404).json({ success: false, message: 'Commission not found' });
    }

    if (commission.artist.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this commission'
      });
    }

   if (status) commission.status = status;
    if (agreedPrice !== undefined) commission.agreedPrice = agreedPrice;
    if (statusNotes) commission.statusNotes = statusNotes;

    // Stamp completion date the first time a commission is marked completed
    if (status === 'completed' && !commission.completionDate) {
      commission.completionDate = Date.now();
    }

    await commission.save();

    res.json({
      success: true,
      message: `Commission ${status || 'updated'} successfully`,
      data: commission
    });
  } catch (error) {
    console.error('PUT /artist-status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Cancel commission request (user)
// @route   PUT /api/commissions/:id/cancel
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const commission = await Commission.findById(id);

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }

    if (commission.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this request' });
    }

    if (commission.status !== 'pending' && commission.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel request with status: ${commission.status}`
      });
    }

    commission.status = 'cancelled';
    commission.cancellationReason = reason || 'No reason provided';
    await commission.save();

    res.json({
      success: true,
      message: 'Commission request cancelled successfully',
      data: commission
    });
  } catch (error) {
    console.error('PUT /cancel error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete commission request (admin only)
// @route   DELETE /api/commissions/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;
    const commission = await Commission.findById(id);

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }

    if (commission.referenceCloudinaryId) {
      try {
        await cloudinary.uploader.destroy(commission.referenceCloudinaryId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
      }
    }

    await commission.deleteOne();

    res.json({
      success: true,
      message: 'Commission request deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /commissions error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;