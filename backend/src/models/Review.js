const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["ARTISAN", "PRESCRIPTEUR"],
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    categories: {
      professionalism: { type: Number, min: 1, max: 5, default: null },
      punctuality: { type: Number, min: 1, max: 5, default: null },
      quality: { type: Number, min: 1, max: 5, default: null },
      cleanliness: { type: Number, min: 1, max: 5, default: null },
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
      description: "True if the review is from a completed meeting",
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "APPROVED",
    },
  },
  { 
    timestamps: true,
    autoIndex: false,
    autoCreate: true
  }
);

// Do NOT create any unique indexes - duplicate checking is handled in the controller
// This allows unlimited free reviews (sourceId: null) for the same artisan

module.exports = mongoose.model("Review", reviewSchema, "avis");
