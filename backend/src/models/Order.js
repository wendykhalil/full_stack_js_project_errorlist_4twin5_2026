const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
  type: String,
  unique: true,
  default: () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `CMD-${year}${month}-${random}`;
  }
},
    
    // Relations
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    artisanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Détails de la commande
    quantity: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    
    unitPrice: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    
    lineTotal: { 
      type: Number, 
      required: true, 
      min: 0 
    },

    // Prix négocié (peut différer du prix indicatif)
    negotiatedPrice: { 
      type: Number, 
      min: 0 
    },
    
    // Adresse de livraison
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: "Tunisie" },
      additionalInfo: { type: String, default: "" }
    },

    // Message de l'artisan
    artisanMessage: { 
      type: String, 
      default: "" 
    },quantity: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    
    unitPrice: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    
    lineTotal: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    
    // Adresse de livraison - rendre les sous-champs optionnels
    deliveryAddress: {
      street: { type: String, required: false }, // ← required: false
      city: { type: String, required: false },   // ← required: false
      postalCode: { type: String, required: false }, // ← required: false
      country: { type: String, default: "Tunisie" },
      additionalInfo: { type: String, default: "" }
    },

    // Statut de la commande
    status: {
      type: String,
      enum: [
        "PENDING",      // En attente
        "ACCEPTED",     // Accepté par fournisseur
        "REFUSED",      // Refusé par fournisseur
        "CONTACTED",    // Contact établi
        "PREPARING",    // En préparation
        "SHIPPED",      // Expédié
        "DELIVERED"     // Livré
      ],
      default: "PENDING"
    },

    // Notes fournisseur (interne)
    supplierNotes: { 
      type: String, 
      default: "" 
    },

    // Historique des statuts
    statusHistory: [{
      status: String,
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      note: String
    }],

    // Dates importantes
    requestedDate: { type: Date, default: Date.now },
    acceptedDate: Date,
    refusedDate: Date,
    shippedDate: Date,
    deliveredDate: Date,
    
    // Contact hors plateforme
    externalContact: {
      phone: String,
      email: String,
      notes: String
    }
  },
  { timestamps: true }
);

// ✅ VERSION CORRIGÉE - Générer un numéro de commande unique avant la création
orderSchema.pre("save", function () {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");

    this.orderNumber = `CMD-${year}${month}-${random}`;
  }
});

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ artisanId: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);