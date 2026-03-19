const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true },
    filename: { type: String, trim: true },
    storedFilename: { type: String, trim: true },
    type: { type: String, trim: true },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isSystemMessage: {
      type: Boolean,
      default: false,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
