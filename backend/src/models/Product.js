const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: { type: String, required: true, trim: true, maxlength: 140 },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    description: { type: String, default: "", trim: true },

    price: { type: Number, required: true, min: 0 },

    stock: { type: Number, default: 0, min: 0 },

    imageUrls: [{ type: String }],

    documentation: [{ type: String }], // PDFs et autres docs
    
    // ✅ NOUVEAU : Fiche technique (PDF ou HTML)
    technicalSheet: {
      type: String, // URL du PDF ou contenu HTML
      default: ""
    },

    isApproved: { type: Boolean, default: false }, // admin validates products
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);