const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Report = require('../src/models/Report');
const ActivityLog = require('../src/models/ActivityLog');
const { notifyAdmins } = require('../src/socket');
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
      status: 'PENDING',
      severity: getSeverityFromReason(reason),
      evidenceImage: req.file ? req.file.filename : null
    };

    // Save to database
    const report = await Report.create(reportData);
    try {
      notifyAdmins({
        title: 'Nouveau signalement',
        message: `${reportData.reportedBy.name} a signalé ${reportData.reportedUser.name}`,
      });
    } catch (_) {
      // optional realtime path
    }

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const match = {};
    if (req.query.status) match.status = String(req.query.status).toUpperCase();
    if (req.query.severity) match.severity = String(req.query.severity).toLowerCase();
    if (req.query.from || req.query.to) {
      match.createdAt = {};
      if (req.query.from) match.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) {
        const to = new Date(req.query.to);
        to.setHours(23, 59, 59, 999);
        match.createdAt.$lte = to;
      }
    }

    const reports = await Report.find(match)
      .populate('reportedUser.id', 'firstName lastName email profileImage')
      .populate('reportedBy.id', 'firstName lastName email')
      .populate('actionHistory.performedBy', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments(match);

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
    const { action, reason, note = '' } = req.body;
    const normalizedAction = String(action || '').toUpperCase();
    const workflow = {
      REVIEW: 'UNDER_REVIEW',
      WARN: 'RESOLVED',
      BAN: 'RESOLVED',
      REJECT: 'REJECTED',
    };
    const nextStatus = workflow[normalizedAction];
    if (!nextStatus) {
      return res.status(400).json({
        success: false,
        message: 'Action invalide'
      });
    }
    if ((normalizedAction === 'WARN' || normalizedAction === 'BAN') && !String(reason || '').trim()) {
      return res.status(400).json({ success: false, message: 'La raison est obligatoire pour cette action' });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Signalement introuvable'
      });
    }
    const fromStatus = report.status;
    report.status = nextStatus;
    if (normalizedAction !== 'REVIEW') {
      report.action = normalizedAction;
      report.actionReason = String(reason || '').trim();
      report.actionTakenBy = req.user._id || req.user.id;
      report.actionTakenAt = new Date();
    }
    report.adminNote = String(note || '').trim();
    report.actionHistory.push({
      fromStatus,
      toStatus: nextStatus,
      action: normalizedAction,
      note: String(note || reason || '').trim(),
      performedBy: req.user._id || req.user.id,
      performedAt: new Date(),
    });
    await report.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'ADMIN_REPORT_ACTION',
      details: {
        reportId: String(report._id),
        fromStatus,
        toStatus: nextStatus,
        action: normalizedAction,
        reason: String(reason || ''),
      },
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
    });

    const populated = await Report.findById(report._id)
      .populate('reportedUser.id', 'firstName lastName email profileImage')
      .populate('reportedBy.id', 'firstName lastName email')
      .populate('actionHistory.performedBy', 'firstName lastName email role');

    try {
      notifyAdmins({
        title: 'Signalement mis à jour',
        message: `Signalement ${id} -> ${nextStatus}`,
      });
    } catch (_) {
      // optional realtime path
    }

    res.json({
      success: true,
      message: `Action ${normalizedAction} effectuée avec succès`,
      data: populated
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