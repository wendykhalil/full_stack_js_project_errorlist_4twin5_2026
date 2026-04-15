const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Report = require('../src/models/Report');
const { authRequired } = require('../src/middleware/authMiddleware');
const { requireRoles } = require('../src/middleware/roleMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/reports/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

// POST /api/reports - Create a new report
router.post('/', authRequired, upload.single('evidence'), async (req, res) => {
  try {
    const {
      reportedUserId,
      reportedUserName,
      reason,
      description,
      timestamp
    } = req.body;

    // Validation
    if (!reportedUserId || !reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants'
      });
    }

    if (description.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La description doit contenir au moins 2 caractères'
      });
    }

    // Get reporter info from token
    const reporterId = req.user.id || req.user._id;

    // Create report object
    const reportData = {
      reportedUser: {
        id: reportedUserId,
        name: reportedUserName
      },
      reportedBy: {
        id: reporterId,
        name: req.user.firstName + ' ' + req.user.lastName,
        email: req.user.email
      },
      reason,
      description: description.trim(),
      timestamp: timestamp || new Date().toISOString(),
      status: 'pending',
      severity: getSeverityFromReason(reason),
      evidenceImage: req.file ? req.file.filename : null
    };

    // Save to database
    const report = await Report.create(reportData);

    console.log('New report created:', report._id);

    res.json({
      success: true,
      message: 'Signalement créé avec succès',
      data: report
    });

  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du signalement'
    });
  }
});

// GET /api/admin/reports - Get all reports (admin only)
router.get('/admin/reports', authRequired, requireRoles('ADMIN'), async (req, res) => {
  try {
    // Fetch from database with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const reports = await Report.find()
      .populate('reportedUser.id', 'firstName lastName email profileImage')
      .populate('reportedBy.id', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments();

    res.json({
      success: true,
      data: reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des signalements'
    });
  }
});

// PATCH /api/admin/reports/:id/action - Take action on a report (admin only)
router.patch('/admin/reports/:id/action', authRequired, requireRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    // Validate action
    if (!['warn', 'ban', 'dismiss'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action invalide'
      });
    }

    // Update report in database
    const report = await Report.findByIdAndUpdate(id, {
      status: 'resolved',
      action,
      actionReason: reason,
      actionTakenBy: req.user._id || req.user.id,
      actionTakenAt: new Date()
    }, { new: true });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Signalement introuvable'
      });
    }

    // TODO: Take appropriate action on the reported user
    // if (action === 'warn') {
    //   await sendWarningToUser(report.reportedUser.id, reason);
    // } else if (action === 'ban') {
    //   await banUser(report.reportedUser.id, reason);
    // }

    console.log(`Action ${action} taken on report ${id} with reason: ${reason}`);

    res.json({
      success: true,
      message: `Action ${action} effectuée avec succès`,
      data: report
    });

  } catch (error) {
    console.error('Error taking action on report:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'action sur le signalement'
    });
  }
});

// Helper function to determine severity based on reason
function getSeverityFromReason(reason) {
  const highSeverity = ['Harcèlement ou intimidation', 'Contenu inapproprié'];
  const mediumSeverity = ['Spam ou publicité non sollicitée', 'Comportement abusif'];
  
  if (highSeverity.includes(reason)) return 'high';
  if (mediumSeverity.includes(reason)) return 'medium';
  return 'low';
}

module.exports = router;