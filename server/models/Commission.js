import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  mobileNumber: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: true
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
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  statusNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
commissionSchema.index({ user: 1 });
commissionSchema.index({ status: 1 });
commissionSchema.index({ createdAt: -1 });

export default mongoose.model('Commission', commissionSchema);