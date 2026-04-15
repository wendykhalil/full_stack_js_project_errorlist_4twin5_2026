const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
// const Report = require('../src/models/Report'); // TODO: Create this model
// const { authRequired } = require('../src/middleware/authMiddleware');
// const { requireRoles } = require('../src/middleware/roleMiddleware');

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
router.post('/', upload.single('evidence'), async (req, res) => {
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

    // Get reporter info from token (assuming you have auth middleware)
    const reporterId = req.user.id;

    // Create report object
    const reportData = {
      id: Date.now().toString(), // Use proper ID generation in production
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

    // TODO: Save to database
    // await Report.create(reportData);

    // For now, just log it
    console.log('New report received:', reportData);

    res.json({
      success: true,
      message: 'Signalement créé avec succès',
      data: reportData
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
router.get('/admin/reports', async (req, res) => {
  try {
    // TODO: Check if user is admin
    // if (req.user.role !== 'ADMIN') {
    //   return res.status(403).json({ success: false, message: 'Accès refusé' });
    // }

    // TODO: Fetch from database
    // const reports = await Report.find().populate('reportedUser reportedBy');

    // For now, return empty array
    const reports = [];

    res.json({
      success: true,
      data: reports
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
router.patch('/admin/reports/:id/action', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    // TODO: Check if user is admin
    // if (req.user.role !== 'ADMIN') {
    //   return res.status(403).json({ success: false, message: 'Accès refusé' });
    // }

    // Validate action
    if (!['warn', 'ban', 'dismiss'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action invalide'
      });
    }

    // TODO: Update report in database
    // const report = await Report.findByIdAndUpdate(id, {
    //   status: 'resolved',
    //   action,
    //   actionReason: reason,
    //   actionTakenBy: req.user.id,
    //   actionTakenAt: new Date()
    // });

    // TODO: Take appropriate action on the reported user
    // if (action === 'warn') {
    //   await sendWarningToUser(report.reportedUser.id, reason);
    // } else if (action === 'ban') {
    //   await banUser(report.reportedUser.id, reason);
    // }

    console.log(`Action ${action} taken on report ${id} with reason: ${reason}`);

    res.json({
      success: true,
      message: `Action ${action} effectuée avec succès`
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