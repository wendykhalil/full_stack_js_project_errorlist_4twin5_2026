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

    status: {
      type: String,
      enum: ["ONGOING", "COMPLETED", "CANCELED"],
      default: "ONGOING",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
