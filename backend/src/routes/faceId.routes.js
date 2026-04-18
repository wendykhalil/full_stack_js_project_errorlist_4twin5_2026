const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { authRequired } = require("../middleware/authMiddleware");

// Register Face ID for a user
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

    if (!credentialId || !publicKey) {
      console.log('Missing required Face ID data');
      return res.status(400).json({ message: "Missing required Face ID data" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log('Found user for Face ID registration:', user.email);

    // Store Face ID registration (in production, use a separate collection)
    user.faceIdCredentials = {
      credentialId,
      publicKey,
      registeredAt: new Date(),
      deviceInfo: deviceInfo || {}
    };
    
    console.log('Saving Face ID credentials for user:', user.email);
    await user.save();
    console.log('Face ID credentials saved successfully');

    res.json({
      success: true,
      message: "Face ID registered successfully",
      credentialId
    });

  } catch (error) {
    console.error("Face ID registration error:", error);
    res.status(500).json({ message: "Error registering Face ID: " + error.message });
  }
});

// Authenticate with Face ID
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

    if (!credentialId || !signature) {
      return res.status(400).json({ message: "Missing Face ID authentication data" });
    }

    // Find user by credential ID or stored user info
    let user = null;
    
    // First try to find by credential ID
    if (credentialId) {
      user = await User.findOne({ 
        "faceIdCredentials.credentialId": credentialId 
      });
    }
    
    // If not found and we have stored user info, try to find by user ID
    if (!user && storedUserId) {
      user = await User.findById(storedUserId);
      
      // Verify the credential ID matches what's stored for this user
      if (user && user.faceIdCredentials && user.faceIdCredentials.credentialId !== credentialId) {
        console.log('Credential ID mismatch for user:', storedUserId);
        return res.status(401).json({ 
          message: "Face ID credentials don't match. Please re-register Face ID in your profile settings." 
        });
      }
    }
    
    // If still not found, try by email as fallback
    if (!user && storedUserEmail) {
      user = await User.findOne({ email: storedUserEmail });
      console.log('Found user by email fallback:', user ? 'yes' : 'no');
    }

    if (!user) {
      console.log('No user found for Face ID credentials');
      return res.status(404).json({ 
        message: "Face ID credentials not found. Please re-register Face ID in your profile settings." 
      });
    }

    // Check if user has Face ID registered
    if (!user.faceIdCredentials || !user.faceIdCredentials.credentialId) {
      console.log('User found but no Face ID credentials registered:', user.email);
      return res.status(401).json({ 
        message: "No Face ID registered for this account. Please set up Face ID in your profile settings." 
      });
    }

    // In production, you would:
    // 1. Verify the signature using the stored public key
    // 2. Validate the authenticator data
    // 3. Check the client data JSON
    // 4. Ensure the challenge matches

    // For demo purposes, we'll simulate successful verification
    const isValid = true; // In production: verify signature with stored public key

    if (!isValid) {
      return res.status(401).json({ message: "Face ID authentication verification failed" });
    }

    console.log('Face ID authentication successful for user:', user.email);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        authMethod: 'faceId'
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Update last login
    user.lastLogin = new Date();
    user.lastLoginMethod = 'faceId';
    await user.save();

    res.json({
      success: true,
      message: "Face ID authentication successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        authMethod: 'faceId'
      }
    });

  } catch (error) {
    console.error("Face ID authentication error:", error);
    res.status(500).json({ message: "Error authenticating with Face ID. Please try again or use password login." });
  }
});

// Check Face ID registration status
router.get("/status", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    const isRegistered = !!(user.faceIdCredentials && user.faceIdCredentials.credentialId);
    
    res.json({
      isRegistered,
      registeredAt: user.faceIdCredentials?.registeredAt || null,
      deviceInfo: user.faceIdCredentials?.deviceInfo || null
    });

  } catch (error) {
    console.error("Face ID status error:", error);
    res.status(500).json({ message: "Error checking Face ID status" });
  }
});

// Remove Face ID registration
router.delete("/remove", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.faceIdCredentials) {
      return res.status(404).json({ message: "No Face ID registration found" });
    }

    user.faceIdCredentials = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Face ID registration removed successfully"
    });

  } catch (error) {
    console.error("Face ID removal error:", error);
    res.status(500).json({ message: "Error removing Face ID registration" });
  }
});

// Get Face ID usage statistics (admin only)
router.get("/stats", authRequired, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const totalUsers = await User.countDocuments();
    const faceIdUsers = await User.countDocuments({ 
      "faceIdCredentials.credentialId": { $exists: true } 
    });
    
    const recentFaceIdLogins = await User.countDocuments({
      lastLoginMethod: 'faceId',
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    res.json({
      totalUsers,
      faceIdUsers,
      adoptionRate: totalUsers > 0 ? ((faceIdUsers / totalUsers) * 100).toFixed(1) : 0,
      recentFaceIdLogins,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Face ID stats error:", error);
    res.status(500).json({ message: "Error fetching Face ID statistics" });
  }
});

module.exports = router;