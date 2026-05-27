import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import Commission from '../models/Commission.js';
import { protect } from '../middleware/auth.js';

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

// @desc    Get all commission requests (admin only)
// @route   GET /api/commissions
router.get('/', protect, async (req, res) => {
  try {
    console.log('Fetching all commissions - User:', req.user.email, 'Role:', req.user.role);
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }
    
    const commissions = await Commission.find({})
      .populate('user', 'name email mobileNumber location')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${commissions.length} commissions`);
    
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
    console.log('Fetching user commissions - User:', req.user._id);
    
    const commissions = await Commission.find({ user: req.user._id })
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

// @desc    Submit commission request
// @route   POST /api/commissions
router.post('/', protect, upload.single('referenceImage'), async (req, res) => {
  try {
    console.log('Creating commission for user:', req.user._id);
    console.log('Request body:', req.body);
    
    const { description, dimensions, deadline, budget } = req.body;
    
    // Validate required fields
    if (!description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Description is required' 
      });
    }
    
    const commissionData = {
      user: req.user._id,
      name: req.user.name,
      email: req.user.email,
      mobileNumber: req.user.mobileNumber || '',
      description: description,
      dimensions: dimensions || '',
      deadline: deadline || null,
      budget: budget ? Number(budget) : null,
      status: 'pending',
      statusNotes: '',
      cancellationReason: ''
    };

    if (req.file) {
      commissionData.referenceImageUrl = req.file.path;
      commissionData.referenceCloudinaryId = req.file.filename;
    }

    const commission = await Commission.create(commissionData);
    
    console.log('Commission created successfully:', commission._id);
    
    res.status(201).json({ 
      success: true, 
      message: 'Commission request submitted successfully',
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
    console.log('Updating commission:', req.params.id);
    console.log('Update data:', req.body);
    
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
    
    // Validate status
    const validStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    const commission = await Commission.findById(id);
    
    if (!commission) {
      return res.status(404).json({ 
        success: false, 
        message: 'Commission not found' 
      });
    }
    
    // Update fields
    commission.status = status;
    if (statusNotes !== undefined) {
      commission.statusNotes = statusNotes;
    }
    
    await commission.save();
    
    console.log('Commission updated successfully:', commission._id, 'New status:', status);
    
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

// @desc    Cancel commission request (user)
// @route   PUT /api/commissions/:id/cancel
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    console.log('Cancelling commission:', id, 'Reason:', reason);
    
    const commission = await Commission.findById(id);
    
    if (!commission) {
      return res.status(404).json({ 
        success: false, 
        message: 'Commission not found' 
      });
    }

    // Check if the user owns this commission
    if (commission.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to cancel this request' 
      });
    }

    // Check if commission can be cancelled
    if (commission.status !== 'pending' && commission.status !== 'accepted') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot cancel request with status: ${commission.status}` 
      });
    }

    commission.status = 'cancelled';
    commission.cancellationReason = reason || 'No reason provided';
    await commission.save();

    console.log('Commission cancelled successfully:', commission._id);

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
    console.log('Deleting commission:', id);
    
    const commission = await Commission.findById(id);
    
    if (!commission) {
      return res.status(404).json({ 
        success: false, 
        message: 'Commission not found' 
      });
    }

    // Delete reference image from Cloudinary if exists
    if (commission.referenceCloudinaryId) {
      try {
        await cloudinary.uploader.destroy(commission.referenceCloudinaryId);
        console.log('Deleted Cloudinary image:', commission.referenceCloudinaryId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with deletion even if Cloudinary fails
      }
    }

    await commission.deleteOne();
    console.log('Commission deleted successfully');

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