const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },

    resetPasswordTokenHash: { type: String, default: null },
    resetPasswordTokenExpiresAt: { type: Date, default: null },
    
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
    },

    // Local password (optional for Google accounts)
    password: {
      type: String,
      required: false,
      default: null,
    },

    phone: {
      type: String,
      required: false,
      default: "",
      trim: true,
      maxlength: 30,
    },

    profilePicture: {
      type: String,
      default: '',
      trim: true,
    },

    role: {
      type: String,
      enum: ["REGISTER_ROLE","ARTISAN","PRESCRIPTEUR","SUPPLIER","ADMIN"],
      required: true,
    },

    // Auth provider info
    authProvider: {
      type: String,
      enum: ["LOCAL", "GOOGLE"],
      default: "LOCAL",
    },
    
    googleSub: {
      type: String,
      default: null,
      index: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationTokenHash: {
      type: String,
      default: null,
    },

    emailVerificationTokenExpiresAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "BLOCKED"],
      default: "ACTIVE",
    },
    
    blockedUntil: {
      type: Date,
      default: null,
    },

    // 🔴 NOUVEAU CHAMP - Référence vers le profil fournisseur
    supplierProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupplierProfile',
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);