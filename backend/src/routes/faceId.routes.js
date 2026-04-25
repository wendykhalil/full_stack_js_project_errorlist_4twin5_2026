const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { authRequired } = require("../middleware/authMiddleware");

// ============= VALIDATEURS =============
class FaceIdValidator {
  static validateRegistrationData(credentialId, publicKey) {
    if (!credentialId || !publicKey) {
      throw new ValidationError("Missing required Face ID data", 400);
    }
  }

  static validateAuthenticationData(credentialId, signature) {
    if (!credentialId || !signature) {
      throw new ValidationError("Missing Face ID authentication data", 400);
    }
  }

  static validateAdminAccess(userRole) {
    if (userRole !== 'ADMIN') {
      throw new AuthorizationError("Admin access required", 403);
    }
  }

  static validateFaceIdExists(faceIdCredentials) {
    if (!faceIdCredentials || !faceIdCredentials.credentialId) {
      throw new ValidationError("No Face ID registered for this account", 401);
    }
  }
}

// ============= SERVICES =============
class FaceIdService {
  static async findUserByCredentials(credentialId, storedUserId, storedUserEmail) {
    let user = null;
    
    // Try by credential ID first
    if (credentialId) {
      user = await User.findOne({ "faceIdCredentials.credentialId": credentialId });
    }
    
    // Try by stored user ID
    if (!user && storedUserId) {
      user = await User.findById(storedUserId);
      
      // Verify credential matches
      if (user && user.faceIdCredentials && 
          user.faceIdCredentials.credentialId !== credentialId) {
        throw new ValidationError(
          "Face ID credentials don't match. Please re-register Face ID in your profile settings.",
          401
        );
      }
    }
    
    // Fallback to email
    if (!user && storedUserEmail) {
      user = await User.findOne({ email: storedUserEmail });
    }
    
    return user;
  }

  static async registerFaceId(user, credentialId, publicKey, deviceInfo) {
    user.faceIdCredentials = {
      credentialId,
      publicKey,
      registeredAt: new Date(),
      deviceInfo: deviceInfo || {}
    };
    
    await user.save();
    return user;
  }

  static async removeFaceId(user) {
    if (!user.faceIdCredentials) {
      throw new ValidationError("No Face ID registration found", 404);
    }
    
    user.faceIdCredentials = undefined;
    await user.save();
    return user;
  }

  static generateAuthToken(user, authMethod = 'faceId') {
    return jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        authMethod
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
  }

  static async updateLastLogin(user, method) {
    user.lastLogin = new Date();
    user.lastLoginMethod = method;
    await user.save();
  }

  static verifySignature(storedPublicKey, signature, authenticatorData, clientDataJSON) {
    // In production: implement actual WebAuthn signature verification
    // This is a placeholder for demo purposes
    return true;
  }

  static async getStatistics() {
    const totalUsers = await User.countDocuments();
    const faceIdUsers = await User.countDocuments({ 
      "faceIdCredentials.credentialId": { $exists: true } 
    });
    
    const recentFaceIdLogins = await User.countDocuments({
      lastLoginMethod: 'faceId',
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    return {
      totalUsers,
      faceIdUsers,
      adoptionRate: totalUsers > 0 ? ((faceIdUsers / totalUsers) * 100).toFixed(1) : 0,
      recentFaceIdLogins,
      timestamp: new Date().toISOString()
    };
  }
}

// ============= RÉPONSES FORMATÉES =============
function formatUserResponse(user) {
  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    authMethod: 'faceId'
  };
}

function formatFaceIdStatus(user) {
  return {
    isRegistered: !!(user.faceIdCredentials && user.faceIdCredentials.credentialId),
    registeredAt: user.faceIdCredentials?.registeredAt || null,
    deviceInfo: user.faceIdCredentials?.deviceInfo || null
  };
}

// ============= ROUTES =============

// POST /register - Register Face ID for a user
router.post("/register", authRequired, async (req, res) => {
  try {
    const { credentialId, publicKey, attestationObject, deviceInfo } = req.body;
    const userId = req.user.id;

    console.log('Face ID registration request:', {
      userId,
      credentialId: credentialId ? 'present' : 'missing',
      publicKey: publicKey ? 'present' : 'missing',
      deviceInfo
    });

    FaceIdValidator.validateRegistrationData(credentialId, publicKey);

    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log('Found user for Face ID registration:', user.email);
    
    await FaceIdService.registerFaceId(user, credentialId, publicKey, deviceInfo);
    console.log('Face ID credentials saved successfully');

    res.json({
      success: true,
      message: "Face ID registered successfully",
      credentialId
    });

  } catch (error) {
    console.error("Face ID registration error:", error);
    
    if (error instanceof ValidationError) {
      return res.status(error.status).json({ message: error.message });
    }
    
    res.status(500).json({ message: "Error registering Face ID: " + error.message });
  }
});

// POST /authenticate - Authenticate with Face ID
router.post("/authenticate", async (req, res) => {
  try {
    const { 
      credentialId, 
      signature, 
      authenticatorData, 
      clientDataJSON,
      storedUserId,
      storedUserEmail 
    } = req.body;

    console.log('Face ID authentication request:', {
      credentialId: credentialId ? 'present' : 'missing',
      signature: signature ? 'present' : 'missing',
      storedUserId,
      storedUserEmail
    });

    FaceIdValidator.validateAuthenticationData(credentialId, signature);

    const user = await FaceIdService.findUserByCredentials(
      credentialId, 
      storedUserId, 
      storedUserEmail
    );

    if (!user) {
      console.log('No user found for Face ID credentials');
      return res.status(404).json({ 
        message: "Face ID credentials not found. Please re-register Face ID in your profile settings." 
      });
    }

    FaceIdValidator.validateFaceIdExists(user.faceIdCredentials);

    // Verify signature
    const isValid = FaceIdService.verifySignature(
      user.faceIdCredentials.publicKey,
      signature,
      authenticatorData,
      clientDataJSON
    );

    if (!isValid) {
      return res.status(401).json({ message: "Face ID authentication verification failed" });
    }

    console.log('Face ID authentication successful for user:', user.email);

    // Generate token and update login info
    const token = FaceIdService.generateAuthToken(user);
    await FaceIdService.updateLastLogin(user, 'faceId');

    res.json({
      success: true,
      message: "Face ID authentication successful",
      token,
      user: formatUserResponse(user)
    });

  } catch (error) {
    console.error("Face ID authentication error:", error);
    
    if (error instanceof ValidationError) {
      return res.status(error.status).json({ message: error.message });
    }
    
    res.status(500).json({ message: "Error authenticating with Face ID. Please try again or use password login." });
  }
});

// GET /status - Check Face ID registration status
router.get("/status", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(formatFaceIdStatus(user));
  } catch (error) {
    console.error("Face ID status error:", error);
    res.status(500).json({ message: "Error checking Face ID status" });
  }
});

// DELETE /remove - Remove Face ID registration
router.delete("/remove", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    await FaceIdService.removeFaceId(user);
    
    res.json({
      success: true,
      message: "Face ID registration removed successfully"
    });
  } catch (error) {
    console.error("Face ID removal error:", error);
    
    if (error instanceof ValidationError) {
      return res.status(error.status).json({ message: error.message });
    }
    
    res.status(500).json({ message: "Error removing Face ID registration" });
  }
});

// GET /stats - Get Face ID usage statistics (admin only)
router.get("/stats", authRequired, async (req, res) => {
  try {
    FaceIdValidator.validateAdminAccess(req.user.role);
    
    const stats = await FaceIdService.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error("Face ID stats error:", error);
    
    if (error instanceof AuthorizationError || error instanceof ValidationError) {
      return res.status(error.status).json({ message: error.message });
    }
    
    res.status(500).json({ message: "Error fetching Face ID statistics" });
  }
});

// ============= CLASSES D'ERREUR =============
class ValidationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ValidationError';
    this.status = status;
  }
}

class AuthorizationError extends Error {
  constructor(message, status = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.status = status;
  }
}

module.exports = router;