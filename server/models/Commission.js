import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  artistName: {
    type: String,
    required: true
  },
  requesterName: {
    type: String,
    required: true
  },
  requesterEmail: {
    type: String,
    required: true
  },
  requesterMobile: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  dimensions: {
    type: String,
    default: ''
  },
  deadline: {
    type: Date,
    default: null
  },
  budget: {
    type: Number,
    default: null
  },
  referenceImageUrl: {
    type: String,
    default: ''
  },
  referenceCloudinaryId: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  agreedPrice: {
    type: Number,
    default: null
  },
  currency: {
    type: String,
    enum: ['INR', 'USD', 'EUR', 'GBP'],
    default: 'INR'
  },
  completionDate: {
    type: Date,
    default: null
  },
  statusNotes: {
    type: String,
    default: ''
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// In Commission.js - Add validation
commissionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.budget && this.budget < 0) {
    next(new Error('Budget cannot be negative'));
  }
  next();
});

// Indexes
commissionSchema.index({ requester: 1 });
commissionSchema.index({ artist: 1 });
commissionSchema.index({ status: 1 });
commissionSchema.index({ createdAt: -1 });

export default mongoose.model('Commission', commissionSchema);