import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Artist from '../models/Artist.js';
import Artwork from '../models/Artwork.js';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import crypto from 'crypto';
import { sendResetPasswordEmail, sendPasswordResetSuccess, sendVerificationEmail } from '../config/email.js';

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

      const userExists = await User.findOne({ $or: [{ email }, { mobileNumber }] });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists with this email or mobile number' });
      }

      const user = await User.create({ name, email, mobileNumber, password });

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
      user.verificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      await user.save();

      await sendVerificationEmail(email, verificationToken, name);

      res.status(201).json({
        success: true,
        message: 'Account created! Please check your email to verify your account before logging in.',
        data: {
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @desc    Verify email with token
// @route   GET /api/users/verify-email/:token
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const verificationToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      verificationToken,
      verificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification link. Please request a new one.'
      });
    }

    user.isVerified = true;
    user.verificationToken = '';
    user.verificationExpire = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully!',
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
});

// @desc    Resend verification email
// @route   POST /api/users/resend-verification
router.post(
  '/resend-verification',
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'If an account with this email exists and is unverified, a new verification link has been sent.'
        });
      }

      if (user.isVerified) {
        return res.status(400).json({ success: false, message: 'This account is already verified. Please log in.' });
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
      user.verificationExpire = Date.now() + 24 * 60 * 60 * 1000;
      await user.save();

      await sendVerificationEmail(email, verificationToken, user.name);

      res.json({
        success: true,
        message: 'Verification email sent. Please check your inbox.'
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

      const user = await User.findOne({ email });

      if (user && (await user.matchPassword(password))) {
        if (!user.isVerified) {
          return res.status(403).json({
            success: false,
            message: 'Please verify your email before logging in. Check your inbox for the verification link.',
            unverified: true
          });
        }

        // Check if user has artist profile
        const artistProfile = await Artist.findOne({ user: user._id });
        const isArtist = !!artistProfile;

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
            isArtist: isArtist,
            artistId: isArtist ? artistProfile._id : null,
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
  try {
    // Check if user has artist profile
    const artistProfile = await Artist.findOne({ user: req.user._id });
    const isArtist = !!artistProfile;

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
        isArtist: isArtist,
        artistId: isArtist ? artistProfile._id : null,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
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
      if (user.profilePicture && user.profilePicture.includes('cloudinary')) {
        const publicId = user.profilePicture.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`profile-pictures/${publicId}`);
      }
      user.profilePicture = req.file.path;
    }

    // Password change with current password verification
    if (req.body.password) {
      if (!req.body.currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password' });
      }

      const isMatch = await user.matchPassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }

      if (req.body.password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }

      user.password = req.body.password;
    }

    await user.save();

    // Check if user has artist profile
    const artistProfile = await Artist.findOne({ user: user._id });
    const isArtist = !!artistProfile;

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
        isArtist: isArtist,
        artistId: isArtist ? artistProfile._id : null
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link.'
        });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
      await user.save();

      const emailSent = await sendResetPasswordEmail(email, resetToken, user.name);

      if (emailSent) {
        res.json({
          success: true,
          message: 'Password reset email sent successfully. Please check your inbox.'
        });
      } else {
        user.resetPasswordToken = '';
        user.resetPasswordExpire = null;
        await user.save();

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

      // ✅ Update password - this is the critical part
      user.password = password;
      user.resetPasswordToken = '';
      user.resetPasswordExpire = null;
      await user.save(); // Password is saved here

      // 🔥 FIX: Send confirmation email in the background
      // Don't await it - don't block the HTTP response
      sendPasswordResetSuccess(user.email, user.name).catch(err => {
        console.error('❌ Failed to send password reset confirmation email:', err.message);
      });

      // ✅ Send response immediately - user doesn't need to wait for email
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

// @desc    Upgrade user to artist
// @route   POST /api/users/upgrade-to-artist
router.post('/upgrade-to-artist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Check if user already has an artist profile
    const existingArtist = await Artist.findOne({ user: user._id });
    
    if (existingArtist) {
      return res.status(400).json({
        success: false,
        message: 'You are already an artist',
        data: { 
          isArtist: true,
          artistId: existingArtist._id,
          role: user.role 
        }
      });
    }

    // Create artist profile
    const artist = await Artist.create({
      user: user._id,
      bio: req.body.bio || user.bio || '',
      specialties: req.body.specialties || [],
      socialLinks: req.body.socialLinks || {
        instagram: '',
        twitter: '',
        facebook: '',
        website: ''
      }
    });

    // Update user role to artist
    user.role = 'artist';
    await user.save();

    // Generate new token with updated role
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Successfully upgraded to artist!',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isArtist: true,
        artistId: artist._id,
        token: token
      }
    });
  } catch (error) {
    console.error('POST /upgrade-to-artist error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Switch back to normal user (remove artist profile)
// @route   POST /api/users/switch-to-user
router.post('/switch-to-user', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Find artist profile
    const artistProfile = await Artist.findOne({ user: user._id });
    
    if (!artistProfile) {
      return res.status(400).json({
        success: false,
        message: 'You are not an artist'
      });
    }

    // Check if artist has any artworks - warn user
    const artworkCount = await Artwork.countDocuments({ artist: user._id });
    
    if (artworkCount > 0) {
      return res.status(400).json({
        success: false,
        message: `You have ${artworkCount} artwork(s) on the platform. Please delete or archive them before switching back to a regular user account.`,
        artworkCount: artworkCount
      });
    }

    // Delete artist profile
    await Artist.findByIdAndDelete(artistProfile._id);

    // Update user role back to user
    user.role = 'user';
    await user.save();

    // Generate new token with updated role
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Successfully switched back to regular user account',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isArtist: false,
        token: token
      }
    });
  } catch (error) {
    console.error('POST /switch-to-user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get user's artist status
// @route   GET /api/users/artist-status
router.get('/artist-status', protect, async (req, res) => {
  try {
    const artistProfile = await Artist.findOne({ user: req.user._id });
    const isArtist = !!artistProfile;

    res.json({
      success: true,
      data: {
        isArtist: isArtist,
        artistId: isArtist ? artistProfile._id : null,
        role: req.user.role,
        hasArtworks: isArtist ? await Artwork.countDocuments({ artist: req.user._id }) : 0
      }
    });
  } catch (error) {
    console.error('GET /artist-status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// routes/userRoutes.js - Add follow/unfollow endpoints

// @desc    Follow/unfollow a user (Instagram style)
// @route   POST /api/users/:id/follow
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Prevent self-follow
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }
    
    const currentUser = await User.findById(req.user._id);
    const isFollowing = currentUser.following.includes(targetUser._id);
    
    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(currentUser._id, {
        $pull: { following: targetUser._id }
      });
      await User.findByIdAndUpdate(targetUser._id, {
        $pull: { followers: currentUser._id }
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(currentUser._id, {
        $addToSet: { following: targetUser._id }
      });
      await User.findByIdAndUpdate(targetUser._id, {
        $addToSet: { followers: currentUser._id }
      });
    }
    
    // Get updated follower count
    const updatedTargetUser = await User.findById(targetUser._id);
    const followersCount = updatedTargetUser.followers?.length || 0;
    
    res.json({ 
      success: true, 
      following: !isFollowing,
      count: followersCount 
    });
  } catch (error) {
    console.error('POST /users/:id/follow error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get user's followers
// @route   GET /api/users/:id/followers
router.get('/:id/followers', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'name profilePicture bio location isArtist role');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: user.followers
    });
  } catch (error) {
    console.error('GET /users/:id/followers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get user's following
// @route   GET /api/users/:id/following
router.get('/:id/following', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'name profilePicture bio location isArtist role');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: user.following
    });
  } catch (error) {
    console.error('GET /users/:id/following error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;