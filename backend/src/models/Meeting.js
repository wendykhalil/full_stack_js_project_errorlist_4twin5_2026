const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    // References
    artisanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    prescripteurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Meeting details
    title: {
      type: String,
      default: "Réunion",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    // Date and time
    startDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },

    // Duration in minutes
    duration: {
      type: Number,
      default: 60,
    },

    // Status
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },

    // Cal.com integration
    calComEventId: {
      type: String,
      default: null,
    },
    calComLink: {
      type: String,
      default: null,
    },

    // Google Meet integration
    googleMeetLink: {
      type: String,
      default: null,
    },

    // Notes from artisan on rejection/rescheduling
    notes: {
      type: String,
      default: "",
      trim: true,
    },

    // Contact information from prescripteur
    prescripteurPhone: {
      type: String,
      default: "",
    },
    prescripteurEmail: {
      type: String,
      default: "",
    },

    // Notification tracking
    notificationsSent: {
      artisanNotificationSent: { type: Boolean, default: false },
      prescripteurNotificationSent: { type: Boolean, default: false },
      artisanStatusChangedNotified: { type: Boolean, default: false },
      prescripteurStatusChangedNotified: { type: Boolean, default: false },
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding meetings for artisan/prescripteur
meetingSchema.index({ artisanId: 1, status: 1 });
meetingSchema.index({ prescripteurId: 1, status: 1 });
meetingSchema.index({ startDateTime: 1 });

module.exports = mongoose.model("Meeting", meetingSchema);
