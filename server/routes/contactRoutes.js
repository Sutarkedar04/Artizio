import express from 'express';
import Contact from '../models/Contact.js';
import { protect } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// @desc    Submit contact form
// @route   POST /api/contact
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('message').notEmpty().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const contact = await Contact.create(req.body);
      
      // You could add email notification here
      
      res.status(201).json({ 
        success: true, 
        message: 'Message sent successfully',
        data: contact 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @desc    Get all contact messages (admin only)
// @route   GET /api/contact
router.get('/', protect, async (req, res) => {
  try {
    const messages = await Contact.find().sort('-createdAt');
    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;