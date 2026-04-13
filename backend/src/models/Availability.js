const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    artisanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "BUSY", "BOOKED"],
      default: "AVAILABLE",
    },
    note: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
  },
  { timestamps: true }
);

// One entry per artisan per day
availabilitySchema.index({ artisanId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Availability", availabilitySchema);
