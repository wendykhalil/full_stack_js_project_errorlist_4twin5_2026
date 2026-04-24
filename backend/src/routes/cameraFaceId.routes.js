const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { authRequired } = require("../middleware/authMiddleware");

// Helper function to calculate face similarity
const calculateFaceSimilarity = (descriptor1, descriptor2) => {
  if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
    return 0;
  }
  
  // Calculate Euclidean distance
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
  }
  const distance = Math.sqrt(sum);
  
  // Convert distance to similarity (lower distance = higher similarity)
  const similarity = Math.max(0, 1 - (distance / 2)); // Normalize to 0-1 range
  return similarity;
};

// Register camera Face ID for a user
router.post("/register", authRequired, async (req, res) => {
  try {
    const { faceDescriptor, landmarks } = req.body;
    const userId = req.user.id;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({ message: "Invalid face descriptor data" });
    }

    console.log('Camera Face ID registration for user:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Store camera Face ID registration
    user.cameraFaceIdCredentials = {
      faceDescriptor,
      landmarks: landmarks || [],
      registeredAt: new Date(),
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        registrationIP: req.ip
      }
    };
    
    await user.save();

    console.log('Camera Face ID registered successfully for user:', user.email);

    res.json({
      success: true,
      message: "Camera Face ID registered successfully",
      registrationId: user._id
    });

  } catch (error) {
    console.error("Camera Face ID registration error:", error);
    res.status(500).json({ message: "Error registering camera Face ID" });
  }
});

// Authenticate with camera Face ID
router.post("/authenticate", async (req, res) => {
  console.log('🎯 Camera Face ID authenticate endpoint called');

  try {
    const { faceDescriptor, userId, userEmail } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length === 0) {
      return res.status(400).json({ message: "Données de reconnaissance faciale invalides." });
    }

    // ── Locate the user ──────────────────────────────────────────────────────
    let user = null;

    if (userId && userId !== 'undefined' && userId !== 'null') {
      user = await User.findById(userId).catch(() => null);
    }
    if (!user && userEmail && userEmail !== 'undefined') {
      user = await User.findOne({ email: String(userEmail).toLowerCase().trim() });
    }

    if (!user) {
      return res.status(404).json({
        message: "Aucun compte trouvé. Veuillez saisir votre email pour vous identifier."
      });
    }

    // ── Check registration ───────────────────────────────────────────────────
    const stored = user.cameraFaceIdCredentials?.faceDescriptor;
    if (!Array.isArray(stored) || stored.length !== 128) {
      return res.status(401).json({
        message: "Aucune reconnaissance faciale enregistrée pour ce compte. Veuillez l'activer dans votre profil."
      });
    }

    // ── Validate incoming descriptor ─────────────────────────────────────────
    if (faceDescriptor.length !== 128) {
      return res.status(400).json({
        message: "Descripteur facial invalide. Assurez-vous que face-api.js est correctement chargé."
      });
    }

    const similarity = calculateFaceSimilarity(faceDescriptor, stored);
    console.log(`📊 Face similarity for ${user.email}: ${similarity.toFixed(4)}`);

    // Threshold: 0.55 is reliable for real face-api.js descriptors.
    // Lower values cause false positives; higher values cause false negatives.
    const SIMILARITY_THRESHOLD = 0.55;

    if (similarity < SIMILARITY_THRESHOLD) {
      console.log(`❌ Face mismatch for ${user.email} — similarity ${similarity.toFixed(4)} < ${SIMILARITY_THRESHOLD}`);
      return res.status(401).json({
        message: similarity < 0.3
          ? "Visage non reconnu. Assurez-vous d'être bien éclairé et regardez directement la caméra."
          : "Correspondance insuffisante. Repositionnez votre visage et réessayez.",
        similarity: parseFloat(similarity.toFixed(4))
      });
    }

    // ── Issue JWT using the same shape as auth.service.js signJwt ───────────
    // CRITICAL: must use { sub } not { userId } so authMiddleware can verify it
    const token = jwt.sign(
      { sub: String(user._id), role: user.role, authMethod: 'cameraFaceId' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    user.lastLogin = new Date();
    user.lastLoginMethod = 'cameraFaceId';
    await user.save();

    console.log(`✅ Camera Face ID login successful for ${user.email}`);

    return res.json({
      success: true,
      message: "Authentification réussie.",
      similarity: parseFloat(similarity.toFixed(4)),
      token,
      user: {
        _id: user._id,
        id: String(user._id),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePicture: user.profilePicture || '',
        authMethod: 'cameraFaceId'
      }
    });

  } catch (error) {
    console.error("❌ Camera Face ID authentication error:", error);
    res.status(500).json({ message: "Erreur lors de l'authentification. Veuillez réessayer." });
  }
});

// Check camera Face ID registration status
router.get("/status", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const stored = user.cameraFaceIdCredentials?.faceDescriptor;
    const isRegistered = Array.isArray(stored) && stored.length === 128;

    res.json({
      isRegistered,
      registeredAt: user.cameraFaceIdCredentials?.registeredAt || null,
      deviceInfo: user.cameraFaceIdCredentials?.deviceInfo || null
    });

  } catch (error) {
    console.error("Camera Face ID status error:", error);
    res.status(500).json({ message: "Error checking camera Face ID status" });
  }
});

// Remove camera Face ID registration
router.delete("/remove", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.cameraFaceIdCredentials) {
      return res.status(404).json({ message: "No camera Face ID registration found" });
    }

    user.cameraFaceIdCredentials = undefined;
    await user.save();

    console.log('Camera Face ID registration removed for user:', user.email);

    res.json({
      success: true,
      message: "Camera Face ID registration removed successfully"
    });

  } catch (error) {
    console.error("Camera Face ID removal error:", error);
    res.status(500).json({ message: "Error removing camera Face ID registration" });
  }
});

// Get camera Face ID usage statistics (admin only)
router.get("/stats", authRequired, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const totalUsers = await User.countDocuments();
    const cameraFaceIdUsers = await User.countDocuments({ 
      "cameraFaceIdCredentials.faceDescriptor": { $exists: true } 
    });
    
    const recentCameraFaceIdLogins = await User.countDocuments({
      lastLoginMethod: 'cameraFaceId',
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    res.json({
      totalUsers,
      cameraFaceIdUsers,
      adoptionRate: totalUsers > 0 ? ((cameraFaceIdUsers / totalUsers) * 100).toFixed(1) : 0,
      recentCameraFaceIdLogins,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Camera Face ID stats error:", error);
    res.status(500).json({ message: "Error fetching camera Face ID statistics" });
  }
});

module.exports = router;