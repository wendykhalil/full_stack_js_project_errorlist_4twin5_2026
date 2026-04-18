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

// Smart dashboard analytics
router.get("/dashboard", authRequired, requireRoles("ADMIN"), async (req, res) => {
  try {
    const { period = 30 } = req.query; // Days
    
    // Get all data for analysis
    const projects = await Project.find()
      .populate("artisanId", "firstName lastName")
      .select("title category budgetTND surfaceM2 createdAt status region");
    
    const artisans = await User.find({ role: "ARTISAN" })
      .select("firstName lastName createdAt")
      .lean();
    
    const reviews = await Review.find({ targetType: "ARTISAN" })
      .select("targetId rating createdAt")
      .lean();

    // Call ML service for smart analytics
    const analyticsData = {
      projects: projects.map(p => ({
        id: p._id,
        title: p.title,
        category: p.category,
        budgetTND: p.budgetTND,
        surfaceM2: p.surfaceM2,
        createdAt: p.createdAt,
        status: p.status,
        region: p.region || "Tunis",
        artisanId: p.artisanId?._id
      })),
      artisans: artisans.map(a => ({
        id: a._id,
        firstName: a.firstName,
        lastName: a.lastName,
        createdAt: a.createdAt
      })),
      reviews: reviews,
      period_days: parseInt(period)
    };

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/smart-analytics`, analyticsData);
    
    res.json({
      ...mlResponse.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Smart analytics error:", error);
    if (error.response) {
      res.status(error.response.status).json({ message: error.response.data.error || "ML service error" });
    } else {
      res.status(500).json({ message: "Error fetching smart analytics" });
    }
  }
});

// Service demand predictions
router.get("/demand-forecast", authRequired, requireRoles("ADMIN"), async (req, res) => {
  try {
    const { service, days = 30 } = req.query;
    
    const projects = await Project.find(service ? { category: service } : {})
      .select("category createdAt budgetTND")
      .lean();

    const forecastData = {
      projects: projects,
      service_filter: service,
      forecast_days: parseInt(days)
    };

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/demand-forecast`, forecastData);
    
    res.json(mlResponse.data);

  } catch (error) {
    console.error("Demand forecast error:", error);
    if (error.response) {
      res.status(error.response.status).json({ message: error.response.data.error || "ML service error" });
    } else {
      res.status(500).json({ message: "Error generating demand forecast" });
    }
  }
});

// Pricing trends analysis
router.get("/pricing-trends", authRequired, requireRoles("ADMIN"), async (req, res) => {
  try {
    const { service, region } = req.query;
    
    let query = {};
    if (service) query.category = service;
    if (region) query.region = new RegExp(region, 'i');

    const projects = await Project.find(query)
      .select("category budgetTND surfaceM2 createdAt region")
      .lean();

    const pricingData = {
      projects: projects,
      service_filter: service,
      region_filter: region
    };

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/pricing-trends`, pricingData);
    
    res.json(mlResponse.data);

  } catch (error) {
    console.error("Pricing trends error:", error);
    if (error.response) {
      res.status(error.response.status).json({ message: error.response.data.error || "ML service error" });
    } else {
      res.status(500).json({ message: "Error analyzing pricing trends" });
    }
  }
});

// Artisan performance clustering
router.get("/artisan-clusters", authRequired, requireRoles("ADMIN"), async (req, res) => {
  try {
    // Get artisan data with their profiles
    const artisans = await User.find({ role: "ARTISAN" })
      .select("firstName lastName createdAt")
      .lean();

    const artisanProfiles = await ArtisanProfile.find()
      .select("userId trade region experienceYears")
      .lean();

    // Get projects and reviews for each artisan
    const projects = await Project.find()
      .select("artisanId budgetTND status createdAt")
      .lean();

    const reviews = await Review.find({ targetType: "ARTISAN" })
      .select("targetId rating")
      .lean();

    const clusteringData = {
      artisans: artisans,
      artisan_profiles: artisanProfiles,
      projects: projects,
      reviews: reviews
    };

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/artisan-clustering`, clusteringData);
    
    res.json(mlResponse.data);

  } catch (error) {
    console.error("Artisan clustering error:", error);
    if (error.response) {
      res.status(error.response.status).json({ message: error.response.data.error || "ML service error" });
    } else {
      res.status(500).json({ message: "Error performing artisan clustering" });
    }
  }
});

// Regional performance analysis
router.get("/regional-analysis", authRequired, requireRoles("ADMIN"), async (req, res) => {
  try {
    const projects = await Project.find()
      .select("region category budgetTND surfaceM2 createdAt status")
      .lean();

    const artisanProfiles = await ArtisanProfile.find()
      .select("region trade experienceYears")
      .lean();

    const regionalData = {
      projects: projects,
      artisan_profiles: artisanProfiles
    };

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/regional-analysis`, regionalData);
    
    res.json(mlResponse.data);

  } catch (error) {
    console.error("Regional analysis error:", error);
    if (error.response) {
      res.status(error.response.status).json({ message: error.response.data.error || "ML service error" });
    } else {
      res.status(500).json({ message: "Error performing regional analysis" });
    }
  }
});

// Market insights and predictions
router.get("/market-insights", authRequired, requireRoles("ADMIN"), async (req, res) => {
  try {
    const { timeframe = "monthly" } = req.query;
    
    const projects = await Project.find()
      .select("category budgetTND surfaceM2 createdAt status region")
      .lean();

    const artisans = await User.find({ role: "ARTISAN" })
      .select("createdAt")
      .lean();

    const insightsData = {
      projects: projects,
      artisans: artisans,
      timeframe: timeframe
    };

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/market-insights`, insightsData);
    
    res.json(mlResponse.data);

  } catch (error) {
    console.error("Market insights error:", error);
    if (error.response) {
      res.status(error.response.status).json({ message: error.response.data.error || "ML service error" });
    } else {
      res.status(500).json({ message: "Error generating market insights" });
    }
  }
});

module.exports = router;