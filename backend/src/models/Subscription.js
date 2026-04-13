const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  plan: String,
  status: String,
  changedAt: { type: Date, default: Date.now },
  note: { type: String, default: "" },
}, { _id: false });

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
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    canceledAt: { type: Date, default: null },
    trialEndsAt: { type: Date, default: null },
    isOnTrial: { type: Boolean, default: false },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
