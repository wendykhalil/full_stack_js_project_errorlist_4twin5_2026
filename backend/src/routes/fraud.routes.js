const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ArtisanProfile = require("../models/ArtisanProfile");
const Project = require("../models/Project");
const Review = require("../models/Review");
const { authRequired } = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

// Fraud detection dashboard
router.get("/dashboard", authRequired, requireRoles("ADMIN"), async (req, res) => {
  try {
    // Get recent suspicious activities
    const recentArtisans = await User.find({ role: "ARTISAN" })
      .populate("supplierProfile")
      .sort({ createdAt: -1 })
      .limit(20)
      .select("firstName lastName email createdAt status");

    const recentProjects = await Project.find()
      .populate("artisanId", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(20)
      .select("title budgetTND surfaceM2 createdAt status");

    // Fraud statistics
    const fraudStats = {
      totalArtisans: await User.countDocuments({ role: "ARTISAN" }),
      suspiciousArtisans: 0, // Will be calculated by ML
      totalProjects: await Project.countDocuments(),
      suspiciousProjects: 0, // Will be calculated by ML
      flaggedUsers: await User.countDocuments({ status: "SUSPENDED" }),
      recentAlerts: 0
    };

    res.json({
      fraudStats,
      recentArtisans,
      recentProjects,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Fraud dashboard error:", error);
    res.status(500).json({ message: "Error fetching fraud dashboard data" });
  }
});

// Scan artisan for fraud
router.post("/scan/artisan/:id", authRequired, requireRoles("ADMIN"), async (req, res) => {
  try {
    const artisanId = req.params.id;
    
    // Get artisan data
    const artisan = await User.findById(artisanId).populate("supplierProfile");
    if (!artisan || artisan.role !== "ARTISAN") {
      return res.status(404).json({ message: "Artisan not found" });
    }

    const artisanProfile = await ArtisanProfile.findOne({ userId: artisanId });
    
    // Get artisan's projects and reviews
    const projects = await Project.find({ artisanId }).select("budgetTND surfaceM2 createdAt status");
    const reviews = await Review.find({ targetId: artisanId, targetType: "ARTISAN" }).select("rating createdAt");
    
    // Calculate account age
    const accountAgeMs = Date.now() - new Date(artisan.createdAt).getTime();
    const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));
    
    // Calculate average project complexity (simplified)
    const avgComplexity = projects.length > 0 ? 
      projects.reduce((sum, p) => sum + (p.surfaceM2 > 200 ? 4 : p.surfaceM2 > 100 ? 3 : 2), 0) / projects.length : 3;
    
    // Prepare data for ML service
    const fraudData = {
      artisan_id: artisanId,
      firstName: artisan.firstName,
      lastName: artisan.lastName,
      phone: artisan.phone,
      trade: artisanProfile?.trade || "Autre",
      region: artisanProfile?.region || "",
      description: artisanProfile?.description || "",
      experience_years: artisanProfile?.experienceYears || 0,
      total_projects: projects.length,
      account_age_days: accountAgeDays,
      avg_project_complexity: avgComplexity,
      ratings: reviews.map(r => r.rating),
      rating_dates: reviews.map(r => new Date(r.createdAt).getTime()),
      project_locations: projects.map(p => "Tunisia") // Simplified
    };

    // Call ML service for fraud detection
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/detect-fraud-artisan`, fraudData);
    
    res.json({
      artisan: {
        id: artisanId,
        name: `${artisan.firstName} ${artisan.lastName}`,
        email: artisan.email,
        trade: artisanProfile?.trade,
        region: artisanProfile?.region,
        accountAge: accountAgeDays,
        totalProjects: projects.length,
        avgRating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0
      },
      fraudAnalysis: mlResponse.data.fraud_analysis,
      timestamp: mlResponse.data.timestamp
    });

  } catch (error) {
    console.error("Artisan fraud scan error:", error);
    if (error.response) {
      res.status(error.response.status).json({ message: error.response.data.error || "ML service error" });
    } else {
      res.status(500).json({ message: "Error scanning artisan for fraud" });
    }
  }
});

// Scan project for fraud
router.post("/scan/project/:id", authRequired, requireRoles("ADMIN"), async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Get project data
    const project = await Project.findById(projectId).populate("artisanId", "firstName lastName");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get user's recent projects for pattern analysis
    const userRecentProjects = await Project.countDocuments({
      artisanId: project.artisanId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    // Prepare data for ML service
    const fraudData = {
      project_id: projectId,
      title: project.title,
      description: project.description,
      budgetTND: project.budgetTND,
      surfaceM2: project.surfaceM2,
      startDate: project.startDate,
      endDate: project.endDate,
      category: project.category,
      artisanId: project.artisanId?._id,
      user_recent_projects: userRecentProjects,
      contactPhone: project.contactPhone || ""
    };

    // Call ML service for fraud detection
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/detect-fraud-project`, fraudData);
    
    res.json({
      project: {
        id: projectId,
        title: project.title,
        budget: project.budgetTND,
        surface: project.surfaceM2,
        artisan: project.artisanId ? `${project.artisanId.firstName} ${project.artisanId.lastName}` : "N/A",
        createdAt: project.createdAt
      },
      fraudAnalysis: mlResponse.data.fraud_analysis,
      timestamp: mlResponse.data.timestamp
    });

  } catch (error) {
    console.error("Project fraud scan error:", error);
    if (error.response) {
      res.status(error.response.status).json({ message: error.response.data.error || "ML service error" });
    } else {
      res.status(500).json({ message: "Error scanning project for fraud" });
    }
  }
});

// Batch fraud scan
router.post("/scan/batch", authRequired, requireRoles("ADMIN"), async (req, res) => {
  try {
    const { scanType, limit = 50 } = req.body;
    
    if (!scanType || !["artisans", "projects"].includes(scanType)) {
      return res.status(400).json({ message: "Invalid scan type. Use 'artisans' or 'projects'" });
    }

    let entities = [];
    
    if (scanType === "artisans") {
      const artisans = await User.find({ role: "ARTISAN" })
        .populate("supplierProfile")
        .limit(limit)
        .select("firstName lastName phone createdAt");
      
      for (const artisan of artisans) {
        const artisanProfile = await ArtisanProfile.findOne({ userId: artisan._id });
        const projects = await Project.find({ artisanId: artisan._id });
        const reviews = await Review.find({ targetId: artisan._id, targetType: "ARTISAN" });
        
        const accountAgeDays = Math.floor((Date.now() - new Date(artisan.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        
        entities.push({
          id: artisan._id,
          firstName: artisan.firstName,
          lastName: artisan.lastName,
          phone: artisan.phone,
          trade: artisanProfile?.trade || "Autre",
          region: artisanProfile?.region || "",
          description: artisanProfile?.description || "",
          experience_years: artisanProfile?.experienceYears || 0,
          total_projects: projects.length,
          account_age_days: accountAgeDays,
          ratings: reviews.map(r => r.rating)
        });
      }
    } else if (scanType === "projects") {
      const projects = await Project.find()
        .limit(limit)
        .select("title description budgetTND surfaceM2 startDate endDate category artisanId createdAt");
      
      entities = projects.map(project => ({
        id: project._id,
        title: project.title,
        description: project.description,
        budgetTND: project.budgetTND,
        surfaceM2: project.surfaceM2,
        startDate: project.startDate,
        endDate: project.endDate,
        category: project.category,
        artisanId: project.artisanId
      }));
    }

    // Call ML service for batch fraud detection
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/fraud-batch-scan`, {
      scan_type: scanType,
      entities: entities
    });
    
    res.json(mlResponse.data);

  } catch (error) {
    console.error("Batch fraud scan error:", error);
    if (error.response) {
      res.status(error.response.status).json({ message: error.response.data.error || "ML service error" });
    } else {
      res.status(500).json({ message: "Error performing batch fraud scan" });
    }
  }
});

// Take action on fraud detection
router.post("/action", authRequired, requireRoles("ADMIN"), async (req, res) => {
  try {
    const { entityType, entityId, action, reason } = req.body;
    
    if (!entityType || !entityId || !action) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let result = {};
    
    if (entityType === "ARTISAN" && action === "SUSPEND") {
      await User.findByIdAndUpdate(entityId, { 
        status: "SUSPENDED",
        suspensionReason: reason || "Fraud detection",
        suspendedAt: new Date()
      });
      result.message = "Artisan account suspended";
    } else if (entityType === "PROJECT" && action === "HIDE") {
      await Project.findByIdAndUpdate(entityId, { 
        status: "HIDDEN",
        hiddenReason: reason || "Fraud detection",
        hiddenAt: new Date()
      });
      result.message = "Project hidden from public view";
    } else if (action === "FLAG") {
      // Add flag to entity (would need a flags collection in real implementation)
      result.message = "Entity flagged for review";
    }
    
    res.json({
      success: true,
      action: action,
      entityType: entityType,
      entityId: entityId,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Fraud action error:", error);
    res.status(500).json({ message: "Error taking fraud action" });
  }
});

module.exports = router;