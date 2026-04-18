const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ArtisanProfile = require("../models/ArtisanProfile");
const Project = require("../models/Project");
const Review = require("../models/Review");
const { authRequired } = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");

// Admin dashboard statistics
router.get("/dashboard/stats", authRequired, requireRoles("ADMIN"), async (req, res) => {
  try {
    // Artisan statistics
    const totalArtisans = await User.countDocuments({ role: "ARTISAN" });
    const activeArtisans = await User.countDocuments({ 
      role: "ARTISAN", 
      status: "ACTIVE" 
    });
    const inactiveArtisans = totalArtisans - activeArtisans;

    // Project statistics
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ status: "ACTIVE" });
    const completedProjects = await Project.countDocuments({ status: "COMPLETED" });
    const pendingProjects = await Project.countDocuments({ status: "PENDING" });

    // Top rated artisans
    const topRatedArtisans = await Review.aggregate([
      { $match: { targetType: "ARTISAN" } },
      {
        $group: {
          _id: "$targetId",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      },
      { $match: { totalReviews: { $gte: 3 } } },
      { $sort: { avgRating: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "artisan"
        }
      },
      {
        $lookup: {
          from: "artisanprofiles",
          localField: "_id",
          foreignField: "userId",
          as: "profile"
        }
      },
      {
        $project: {
          artisanId: "$_id",
          avgRating: { $round: ["$avgRating", 2] },
          totalReviews: 1,
          name: { $concat: [{ $arrayElemAt: ["$artisan.firstName", 0] }, " ", { $arrayElemAt: ["$artisan.lastName", 0] }] },
          trade: { $arrayElemAt: ["$profile.trade", 0] },
          region: { $arrayElemAt: ["$profile.region", 0] }
        }
      }
    ]);

    // Most active artisans (by project count)
    const mostActiveArtisans = await Project.aggregate([
      {
        $group: {
          _id: "$artisanId",
          projectCount: { $sum: 1 },
          completedProjects: {
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] }
          }
        }
      },
      { $sort: { projectCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "artisan"
        }
      },
      {
        $lookup: {
          from: "artisanprofiles",
          localField: "_id",
          foreignField: "userId",
          as: "profile"
        }
      },
      {
        $project: {
          artisanId: "$_id",
          projectCount: 1,
          completedProjects: 1,
          completionRate: {
            $round: [
              { $multiply: [{ $divide: ["$completedProjects", "$projectCount"] }, 100] },
              1
            ]
          },
          name: { $concat: [{ $arrayElemAt: ["$artisan.firstName", 0] }, " ", { $arrayElemAt: ["$artisan.lastName", 0] }] },
          trade: { $arrayElemAt: ["$profile.trade", 0] },
          region: { $arrayElemAt: ["$profile.region", 0] }
        }
      }
    ]);

    // Recent activity
    const recentProjects = await Project.find()
      .populate("artisanId", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title status budgetTND createdAt artisanId");

    // Monthly project trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await Project.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 },
          totalBudget: { $sum: "$budgetTND" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          month: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              { $cond: [
                { $lt: ["$_id.month", 10] },
                { $concat: ["0", { $toString: "$_id.month" }] },
                { $toString: "$_id.month" }
              ]}
            ]
          },
          count: 1,
          totalBudget: 1
        }
      }
    ]);

    res.json({
      artisans: {
        total: totalArtisans,
        active: activeArtisans,
        inactive: inactiveArtisans
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        pending: pendingProjects
      },
      topRatedArtisans,
      mostActiveArtisans,
      recentProjects,
      monthlyTrends
    });

  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    res.status(500).json({ message: "Error fetching dashboard statistics" });
  }
});

// Get detailed artisan list with filters
router.get("/artisans", authRequired, requireRoles("ADMIN"), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, trade, region, sortBy = "createdAt" } = req.query;
    
    const filter = { role: "ARTISAN" };
    if (status) filter.status = status;

    const users = await User.find(filter)
      .populate({
        path: "supplierProfile",
        populate: {
          path: "userId",
          model: "ArtisanProfile",
          match: trade ? { trade } : region ? { region } : {}
        }
      })
      .sort({ [sortBy]: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("firstName lastName email status createdAt");

    // Get project counts and ratings for each artisan
    const artisansWithStats = await Promise.all(
      users.map(async (user) => {
        const projectCount = await Project.countDocuments({ artisanId: user._id });
        const completedProjects = await Project.countDocuments({ 
          artisanId: user._id, 
          status: "COMPLETED" 
        });
        
        const ratingStats = await Review.aggregate([
          { $match: { targetId: user._id, targetType: "ARTISAN" } },
          {
            $group: {
              _id: null,
              avgRating: { $avg: "$rating" },
              totalReviews: { $sum: 1 }
            }
          }
        ]);

        const profile = await ArtisanProfile.findOne({ userId: user._id });

        return {
          ...user.toObject(),
          projectCount,
          completedProjects,
          completionRate: projectCount > 0 ? Math.round((completedProjects / projectCount) * 100) : 0,
          avgRating: ratingStats[0]?.avgRating ? Math.round(ratingStats[0].avgRating * 10) / 10 : 0,
          totalReviews: ratingStats[0]?.totalReviews || 0,
          trade: profile?.trade || "N/A",
          region: profile?.region || "N/A"
        };
      })
    );

    const total = await User.countDocuments(filter);

    res.json({
      artisans: artisansWithStats,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: artisansWithStats.length,
        totalItems: total
      }
    });

  } catch (error) {
    console.error("Admin artisans list error:", error);
    res.status(500).json({ message: "Error fetching artisans list" });
  }
});

module.exports = router;