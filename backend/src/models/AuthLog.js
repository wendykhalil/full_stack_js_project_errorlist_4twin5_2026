const mongoose = require('mongoose');

const AuthLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, enum: ['LOGIN','LOGIN_GOOGLE','LOGIN_SMS','LOGOUT'], required: true, index: true },
    ip: { type: String, default: '' },
    country: { type: String, default: '' },
    countryCode: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuthLogSchema.index({ createdAt: -1, action: 1 });

module.exports = mongoose.model('AuthLog', AuthLogSchema);
