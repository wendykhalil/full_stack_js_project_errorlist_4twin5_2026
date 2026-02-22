const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    plan: {
      type: String,
      enum: ["FREE", "BASIC", "PRO"],
      default: "FREE",
      required: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "CANCELED", "EXPIRED"],
      default: "ACTIVE",
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
