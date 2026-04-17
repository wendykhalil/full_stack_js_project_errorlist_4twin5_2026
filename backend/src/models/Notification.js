const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "ORDER_STATUS", "NEW_MESSAGE", "APPLICATION_RECEIVED",
        "APPLICATION_ACCEPTED", "APPLICATION_REJECTED",
        "REVIEW_RECEIVED", "SERVICE_REQUEST_ASSIGNED",
        "SERVICE_REQUEST_COMPLETED", "SUBSCRIPTION_EXPIRING",
        "NEW_SERVICE_REQUEST", "NEW_ORDER", "GENERAL",
      ],
      default: "GENERAL",
    },
    title: { type: String, required: true, maxlength: 120 },
    message: { type: String, default: "", maxlength: 300 },
    link: { type: String, default: "" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
