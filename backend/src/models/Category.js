const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 80 },
    slug: { type: String, required: true, trim: true, unique: true, maxlength: 80 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
