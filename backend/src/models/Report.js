const mongoose = require('mongoose');

const actionHistorySchema = new mongoose.Schema({
  action: String,
  fromStatus: String,
  toStatus: String,
  note: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedAt: { type: Date, default: Date.now },
}, { _id: false });

const reportSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetType: {
    type: String,
    enum: ['USER', 'PRODUCT', 'SERVICE_REQUEST', 'REVIEW'],
    default: 'USER',
  },
  reason: {
    type: String,
    enum: ['FAKE_PROFILE', 'SPAM', 'INAPPROPRIATE_CONTENT', 'FRAUD', 'HARASSMENT', 'OTHER'],
    required: true,
  },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  status: {
    type: String,
    enum: ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'],
    default: 'PENDING',
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM',
  },
  adminNote: { type: String, default: '' },
  actionHistory: { type: [actionHistorySchema], default: [] },
}, { timestamps: true });

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ targetId: 1 });

module.exports = mongoose.model('Report', reportSchema);
