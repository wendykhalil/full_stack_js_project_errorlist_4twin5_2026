const mongoose = require("mongoose");

const prescriberProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    profession: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    region: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PrescriberProfile", prescriberProfileSchema);
