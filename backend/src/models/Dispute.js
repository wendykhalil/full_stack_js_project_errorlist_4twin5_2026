const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const disputeSchema = new mongoose.Schema({
  openedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  againstId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sourceType: {
    type: String,
    enum: ['ORDER', 'SERVICE_REQUEST'],
    required: true,
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  reason: {
    type: String,
    enum: ['NOT_DELIVERED', 'WRONG_PRODUCT', 'NO_SHOW', 'PAYMENT_ISSUE', 'QUALITY_ISSUE', 'OTHER'],
    required: true,
  },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED_FOR_OPENER', 'RESOLVED_FOR_OPPONENT', 'CLOSED'],
    default: 'OPEN',
  },
  messages: { type: [messageSchema], default: [] },
  adminNote: { type: String, default: '' },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ openedBy: 1 });
disputeSchema.index({ againstId: 1 });

module.exports = mongoose.model('Dispute', disputeSchema);
