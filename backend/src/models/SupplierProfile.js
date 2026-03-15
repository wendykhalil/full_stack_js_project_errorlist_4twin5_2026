const mongoose = require("mongoose");

const supplierProfileSchema = new mongoose.Schema(
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  companyName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },

  phone: {
    type: String,
    default: ""
  },

  address: {
    type: String,
    default: ""
  },

  description: {
    type: String,
    default: ""
  },

  logo: {
    type: String,
    default: ""
  },

  categories: {
    type: [String],
    default: [],
  },
},
{ timestamps: true }
);

module.exports = mongoose.model("SupplierProfile", supplierProfileSchema);