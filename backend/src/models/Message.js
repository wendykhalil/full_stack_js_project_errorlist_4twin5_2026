const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: { type: String, required: true, trim: true },

    // Pour les messages système (changement de statut, etc.)
    isSystemMessage: { type: Boolean, default: false },

    // Si le message a été lu
    read: { type: Boolean, default: false },
    readAt: Date,

    // Pièces jointes éventuelles
    attachments: [{
      url: String,
      filename: String,
      type: String // 'image', 'pdf', etc.
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);