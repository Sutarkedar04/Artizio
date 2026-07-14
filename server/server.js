import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

import connectDB from './config/db.js';
import artworkRoutes from './routes/artworkRoutes.js';
import userRoutes from './routes/userRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import commissionRoutes from './routes/commissionRoutes.js';
import artistRoutes from './routes/artistRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import xss from 'xss';

dotenv.config();

// Connect to database
connectDB();

const app = express();

app.set('trust proxy', 1);
app.use(helmet());

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];

// Only allow localhost origins in development — never in production
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push(
    "http://localhost:5173",

  "http://localhost:5174",

  "http://localhost:5175",

  "http://localhost:5176",
  );
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests like Postman or mobile apps
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH','DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use((req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key].trim());
      }
    }
  }
  next();
});

// Prevent NoSQL injection
app.use(mongoSanitize());

// --------------------
// Rate Limiters
// --------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many attempts, please try again later.'
  }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
});

// In server.js - Add this
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 emails per hour
  message: { success: false, message: 'Too many email requests. Please try again later.' }
});

app.use('/api/users/forgot-password', emailLimiter);
app.use('/api/users/resend-verification', emailLimiter);
// Apply rate limiting
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api/users/forgot-password', authLimiter);
app.use('/api/users/reset-password', authLimiter);

app.use('/api', generalLimiter);

// --------------------
// Request Logging
// --------------------
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// --------------------
// Routes
// --------------------
app.use('/api/artworks', artworkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/community', communityRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Artizio Backend API is running 🚀",
  });
});
// --------------------
// 404 Handler
// --------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.url} not found`
  });
});

// --------------------
// Global Error Handler
// --------------------
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});
// In server.js - Add validation
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('  - /api/artworks - Artwork management');
  console.log('  - /api/artists - Artist profiles');
  console.log('  - /api/community - Social features');
  console.log('  - /api/commissions - Commission requests');
  console.log('  - /api/users - User management');
});