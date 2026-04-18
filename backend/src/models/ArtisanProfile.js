const mongoose = require("mongoose");

const artisanProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Informations de base
    trade: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      enum: [
        "Plombier",
        "Électricien",
        "Maçon",
        "Peintre",
        "Menuisier",
        "Carreleur",
        "Chauffagiste",
        "Climatisation",
        "Jardinier",
        "Autre"
      ]
    },

    region: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    // Nouveaux champs
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    profileImage: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    // Localisation pour geospatial queries
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [0, 0]
      }
    },

    // Dernière mise à jour de la localisation
    locationLastUpdated: {
      type: Date,
      default: Date.now
    },

    // Portfolio - référence vers les projets
    portfolio: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Portfolio"
    }],

    // Pour la recherche par distance
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "Tunisie" }
    },

    // Statistiques
    totalProjects: {
      type: Number,
      default: 0
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // Trial features tracking - allows one free attempt per feature for non-subscribed artisans
    trialFeatures: {
      projectCreated: {
        type: Boolean,
        default: false
      },
      portfolioCreated: {
        type: Boolean,
        default: false
      },
      quoteCreated: {
        type: Boolean,
        default: false
      },
      invoiceCreated: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);

// Créer un index géospatial pour les recherches par distance
artisanProfileSchema.index({ location: '2dsphere' });

module.exports = mongoose.model("ArtisanProfile", artisanProfileSchema);