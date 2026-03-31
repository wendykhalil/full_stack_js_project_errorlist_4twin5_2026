const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const portfolioController = require('./portfolio.controller');
const { authRequired } = require('../../middleware/authMiddleware');
const { requireRoles } = require('../../middleware/roleMiddleware');
const { requireActiveSubscription } = require('../../middleware/subscriptionMiddleware');

// Configuration multer pour les images multiples
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'portfolio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

// Routes protégées pour l'artisan
router.post('/',
  authRequired,
  requireRoles('ARTISAN'),
  requireActiveSubscription,
  upload.array('images', 10),
  portfolioController.addProject
);

router.get('/my-projects',
  authRequired,
  requireRoles('ARTISAN'),
  portfolioController.getMyPortfolio
);

router.get('/:id',
  authRequired,
  requireRoles('ARTISAN'),
  portfolioController.getProject
);

router.patch('/:id',
  authRequired,
  requireRoles('ARTISAN'),
  requireActiveSubscription,
  upload.array('images', 10),
  portfolioController.updateProject
);

router.delete('/:id',
  authRequired,
  requireRoles('ARTISAN'),
  requireActiveSubscription,
  portfolioController.deleteProject
);

// ✅ Route publique pour voir le portfolio d'un artisan
router.get('/public/:artisanId',
  portfolioController.getPublicPortfolio
);

module.exports = router;