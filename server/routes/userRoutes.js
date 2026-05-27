import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import crypto from 'crypto';
import { sendResetPasswordEmail, sendPasswordResetSuccess } from '../config/email.js';

const router = express.Router();

// Configure multer for profile pictures
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile-pictures',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/users/register
router.post(
  '/register',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('mobileNumber').isLength({ min: 10, max: 10 }).matches(/^[0-9]+$/),
    body('password').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { name, email, mobileNumber, password } = req.body;

      // Check if user exists
      const userExists = await User.findOne({ $or: [{ email }, { mobileNumber }] });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists with this email or mobile number' });
      }

      // Create user
      const user = await User.create({ name, email, mobileNumber, password });

      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber,
          role: user.role,
          profilePicture: user.profilePicture,
          bio: user.bio,
          location: user.location,
          token: generateToken(user._id, user.role)
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @desc    Login user
// @route   POST /api/users/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Check for user
      const user = await User.findOne({ email });

      if (user && (await user.matchPassword(password))) {
        res.json({
          success: true,
          data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber,
            role: user.role,
            profilePicture: user.profilePicture,
            bio: user.bio,
            location: user.location,
            token: generateToken(user._id, user.role)
          }
        });
      } else {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @desc    Get current user profile
// @route   GET /api/users/me
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    data: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      mobileNumber: req.user.mobileNumber,
      role: req.user.role,
      profilePicture: req.user.profilePicture,
      bio: req.user.bio,
      location: req.user.location,
      createdAt: req.user.createdAt
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
router.put('/profile', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.mobileNumber = req.body.mobileNumber || user.mobileNumber;
    user.bio = req.body.bio || user.bio;
    user.location = req.body.location || user.location;
    
    if (req.file) {
      // Delete old profile picture from Cloudinary if exists
      if (user.profilePicture && user.profilePicture.includes('cloudinary')) {
        const publicId = user.profilePicture.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`profile-pictures/${publicId}`);
      }
      user.profilePicture = req.file.path;
    }

    // If password is being updated
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }
      user.password = req.body.password;
    }

    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.location
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add these routes to your existing userRoutes.js file

// @desc    Forgot password - send reset email
// @route   POST /api/users/forgot-password
// @desc    Forgot password - send reset email
// @route   POST /api/users/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email } = req.body;
      console.log('Password reset requested for:', email);
      
      const user = await User.findOne({ email });

      if (!user) {
        console.log('User not found:', email);
        // For security, don't reveal that user doesn't exist
        return res.status(200).json({ 
          success: true, 
          message: 'If an account exists with this email, you will receive a password reset link.' 
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Set token and expiry (10 minutes)
      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
      await user.save();
      
      console.log('Reset token generated for:', email);
      console.log('Reset token (use this for testing):', resetToken);

      // Send email
      const emailSent = await sendResetPasswordEmail(email, resetToken, user.name);

      if (emailSent) {
        res.json({ 
          success: true, 
          message: 'Password reset email sent successfully. Please check your inbox.' 
        });
      } else {
        // Clear token if email failed
        user.resetPasswordToken = '';
        user.resetPasswordExpire = null;
        await user.save();
        
        // Still return success to avoid revealing email configuration issues
        res.json({ 
          success: true, 
          message: 'If email is configured, a reset link has been sent. Please check your console for the link in development.' 
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Unable to process request. Please try again later.' 
      });
    }
  }
);
// @desc    Reset password with token
// @route   POST /api/users/reset-password
router.post(
  '/reset-password',
  [
    body('password').isLength({ min: 6 }),
    body('confirmPassword').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { token, password, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Passwords do not match' 
        });
      }

      // Hash the token to compare with stored hash
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid or expired reset token' 
        });
      }

      // Set new password
      user.password = password;
      user.resetPasswordToken = '';
      user.resetPasswordExpire = null;
      await user.save();

      // Send success email
      await sendPasswordResetSuccess(user.email, user.name);

      res.json({ 
        success: true, 
        message: 'Password reset successfully. Please login with your new password.' 
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);



// TEMPORARY - Direct password reset (remove after use)
router.post('/temp-reset', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.password = newPassword;
    user.resetPasswordToken = "";
    user.resetPasswordExpire = null;
    await user.save();
    
    res.json({ success: true, message: 'Password reset successfully! Use your new password to login.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;