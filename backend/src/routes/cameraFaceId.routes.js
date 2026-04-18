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
  console.log('📋 Request body:', req.body);
  
  try {
    const { faceDescriptor, userId, userEmail } = req.body;

    console.log('Camera Face ID authentication request:', {
      faceDescriptor: faceDescriptor ? 'present' : 'missing',
      faceDescriptorLength: faceDescriptor ? faceDescriptor.length : 0,
      userId,
      userEmail
    });

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      console.log('❌ Invalid face descriptor data');
      return res.status(400).json({ message: "Invalid face descriptor data" });
    }

    // Find user by ID or email
    let user = null;
    
    if (userId && userId !== 'undefined' && userId !== 'null') {
      console.log('🔍 Looking for user by ID:', userId);
      user = await User.findById(userId);
    }
    
    if (!user && userEmail) {
      console.log('🔍 Looking for user by email:', userEmail);
      user = await User.findOne({ email: userEmail });
    }

    if (!user) {
      console.log('❌ No user found for camera Face ID authentication');
      return res.status(404).json({ 
        message: "User not found. Please register camera Face ID first." 
      });
    }

    console.log('✅ User found:', user.email);

    // Check if user has camera Face ID registered
    if (!user.cameraFaceIdCredentials || !user.cameraFaceIdCredentials.faceDescriptor) {
      console.log('❌ User found but no camera Face ID registered:', user.email);
      return res.status(401).json({ 
        message: "No camera Face ID registered for this account. Please set up camera Face ID in your profile settings." 
      });
    }

    console.log('✅ User has camera Face ID registered');
    console.log('📊 Stored descriptor length:', user.cameraFaceIdCredentials.faceDescriptor.length);
    console.log('📊 Current descriptor length:', faceDescriptor.length);

    // Compare face descriptors
    const storedDescriptor = user.cameraFaceIdCredentials.faceDescriptor;
    
    console.log('🔄 Calculating face similarity...');
    const similarity = calculateFaceSimilarity(faceDescriptor, storedDescriptor);
    
    console.log('📊 Face similarity score:', similarity);

    // Threshold for face recognition (adjust as needed)
    const SIMILARITY_THRESHOLD = 0.4; // 40% similarity required (lowered from 60%)
    
    if (similarity < SIMILARITY_THRESHOLD) {
      console.log('❌ Face recognition failed - similarity too low:', similarity);
      return res.status(401).json({ 
        message: "Face recognition failed. Please ensure your face is clearly visible and try again." 
      });
    }

    console.log('✅ Camera Face ID authentication successful for user:', user.email);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        authMethod: 'cameraFaceId'
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Update last login
    user.lastLogin = new Date();
    user.lastLoginMethod = 'cameraFaceId';
    await user.save();

    console.log('🎉 Sending successful authentication response');

    res.json({
      success: true,
      message: "Camera Face ID authentication successful",
      similarity: similarity,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        authMethod: 'cameraFaceId'
      }
    });

  } catch (error) {
    console.error("❌ Camera Face ID authentication error:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ message: "Error authenticating with camera Face ID. Please try again." });
  }
});

// Check camera Face ID registration status
router.get("/status", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    const isRegistered = !!(user.cameraFaceIdCredentials && user.cameraFaceIdCredentials.faceDescriptor);
    
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