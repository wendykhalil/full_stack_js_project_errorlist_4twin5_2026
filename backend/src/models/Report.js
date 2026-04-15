const mongoose = require('mongoose');

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
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  action: {
    type: String,
    enum: ['warn', 'ban', 'dismiss'],
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
  }
}, {
  timestamps: true
});

// Index for efficient queries
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ 'reportedUser.id': 1 });
reportSchema.index({ 'reportedBy.id': 1 });

module.exports = mongoose.model('Report', reportSchema);