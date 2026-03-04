const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 }, // quantity * unitPrice
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    artisanId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // optional but VERY useful to track order costs by project
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },

    items: { type: [orderItemSchema], default: [] },

    subTotal: { type: Number, required: true, min: 0, default: 0 },
    taxRate: { type: Number, required: true, min: 0, default: 0.19 },
    taxAmount: { type: Number, required: true, min: 0, default: 0 },

    total: { type: Number, required: true, min: 0, default: 0 },

    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
