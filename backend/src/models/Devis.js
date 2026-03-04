const mongoose = require("mongoose");

const devisLineSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 200 },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 }, // quantity * unitPrice
  },
  { _id: false }
);

const devisSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    artisanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lines: {
      type: [devisLineSchema],
      default: [],
    },

    subTotal: { type: Number, required: true, min: 0, default: 0 },
    taxRate: { type: Number, required: true, min: 0, default: 0.19 }, // TVA 19% default
    taxAmount: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },

    total: { type: Number, required: true, min: 0, default: 0 },

    status: {
      type: String,
      enum: ["DRAFT", "SENT", "ACCEPTED", "REJECTED"],
      default: "DRAFT",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Devis", devisSchema);
