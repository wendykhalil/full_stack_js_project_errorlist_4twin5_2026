const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema(
  {
    artisanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ArtisanProfile",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    date: {
      type: Date,
      required: true,
    },

    images: [{
      type: String,
      required: true,
    }],

    // Coordonnées du projet (optionnel)
    projectLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    },

    tags: [{
      type: String,
      trim: true
    }],

    // ✅ S'assurer que isPublic est true par défaut
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Portfolio", portfolioSchema);