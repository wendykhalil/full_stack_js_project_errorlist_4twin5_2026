const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    artisanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, trim: true, maxlength: 500, default: "" },
    proposedPrice: { type: Number, min: 0, default: null },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
    },
    appliedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const serviceRequestSchema = new mongoose.Schema(
  {
    prescripteurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    trade: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "Plombier", "Électricien", "Maçon", "Peintre", "Menuisier",
        "Carreleur", "Chauffagiste", "Climatisation", "Jardinier", "Autre",
      ],
    },
    city: { type: String, trim: true, maxlength: 80, default: "" },
    budgetTND: { type: Number, min: 0, default: 0 },
    deadline: { type: Date, default: null },
    status: {
      type: String,
      enum: ["OPEN", "ASSIGNED", "COMPLETED", "CANCELLED"],
      default: "OPEN",
    },
    assignedArtisanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    applications: { type: [applicationSchema], default: [] },
  },
  { timestamps: true }
);

serviceRequestSchema.index({ status: 1, trade: 1, city: 1 });
serviceRequestSchema.index({ prescripteurId: 1 });

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
