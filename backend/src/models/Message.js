const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // Rendre orderId optionnel
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: false, // ← Changé de true à false
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

    content: { 
      type: String, 
      required: true, 
      trim: true 
    },

    isSystemMessage: { 
      type: Boolean, 
      default: false 
    },

    read: { 
      type: Boolean, 
      default: false 
    },
    readAt: Date,

    attachments: [{
      url: String,
      filename: String,
      type: String
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);