const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    artisanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },

    category: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },

    location: {
      city: { type: String, trim: true, maxlength: 80, default: '' },
      address: { type: String, trim: true, maxlength: 180, default: '' },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },

    budgetTND: {
      type: Number,
      min: 0,
      default: 0,
    },

    surfaceM2: {
      type: Number,
      min: 0,
      default: 0,
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    contactPhone: { type: String, trim: true, maxlength: 40, default: '' },

    // legacy (kept for backward compatibility)
    client: {
      name: { type: String, trim: true, maxlength: 120, default: '' },
      phone: { type: String, trim: true, maxlength: 40, default: '' },
    },

    materials: [{ type: String, trim: true, maxlength: 80 }],

    images: [
      {
        url: { type: String, required: true },
        filename: { type: String, required: true },
        originalName: { type: String, default: '' },
        mimetype: { type: String, default: '' },
        size: { type: Number, default: 0 },
      },
    ],

    status: {
      type: String,
      enum: ["ACTIVE", "PENDING", "COMPLETED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
