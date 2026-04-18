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
    },

    // Face ID credentials for WebAuthn (passkey)
    faceIdCredentials: {
      credentialId: { type: String, default: null },
      publicKey: { type: String, default: null },
      registeredAt: { type: Date, default: null },
      deviceInfo: { type: mongoose.Schema.Types.Mixed, default: {} }
    },

    // Camera Face ID credentials
    cameraFaceIdCredentials: {
      faceDescriptor: { type: [Number], default: null },
      landmarks: { type: mongoose.Schema.Types.Mixed, default: [] },
      registeredAt: { type: Date, default: null },
      deviceInfo: { type: mongoose.Schema.Types.Mixed, default: {} }
    },

    // Authentication tracking
    lastLogin: { type: Date, default: null },
    lastLoginMethod: { 
      type: String, 
      enum: ['password', 'google', 'faceId', 'cameraFaceId', 'phone'], 
      default: null 
    },

    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    }
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1, createdAt: -1 });
userSchema.index({ email: 1, createdAt: -1 });
userSchema.index({ 'location.updatedAt': -1 });

module.exports = mongoose.model("User", userSchema);