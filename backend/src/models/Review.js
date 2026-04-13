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
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
      default: null,
    },
  },
  { timestamps: true }
);

// One review per author per service request
reviewSchema.index({ authorId: 1, sourceId: 1 }, { unique: true, sparse: true });
reviewSchema.index({ targetId: 1, targetType: 1 });

module.exports = mongoose.model("Review", reviewSchema);
