const mongoose = require('mongoose');

const actionHistorySchema = new mongoose.Schema({
  fromStatus: {
    type: String,
    enum: ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'],
    required: true,
  },
  toStatus: {
    type: String,
    enum: ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'],
    required: true,
  },
  action: {
    type: String,
    enum: ['REVIEW', 'WARN', 'BAN', 'REJECT'],
    required: true,
  },
  note: {
    type: String,
    default: '',
    trim: true,
    maxlength: 1000,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  performedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const reportSchema = new mongoose.Schema({
  reportedUser: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true }
  },
  reportedBy: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true }
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'Contenu inapproprié',
      'Harcèlement ou intimidation',
      'Spam ou publicité non sollicitée',
      'Fausses informations',
      'Comportement abusif',
      'Violation des conditions d\'utilisation',
      'Autre'
    ]
  },
  description: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 500
  },
  evidenceImage: {
    type: String, // filename of uploaded image
    default: null
  },
  status: {
    type: String,
    enum: ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'],
    default: 'PENDING'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  action: {
    type: String,
    enum: ['WARN', 'BAN', 'REJECT'],
    default: null
  },
  actionReason: {
    type: String,
    default: null
  },
  actionTakenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  actionTakenAt: {
    type: Date,
    default: null
  },
  adminNote: {
    type: String,
    default: '',
    trim: true,
    maxlength: 1000,
  },
  actionHistory: {
    type: [actionHistorySchema],
    default: [],
  },
}, {
  timestamps: true
});

// Index for efficient queries
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ 'reportedUser.id': 1 });
reportSchema.index({ 'reportedBy.id': 1 });
reportSchema.index({ severity: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);