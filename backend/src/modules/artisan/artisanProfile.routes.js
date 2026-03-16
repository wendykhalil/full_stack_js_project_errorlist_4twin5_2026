const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const artisanProfileController = require('./artisanProfile.controller');
const { authRequired } = require('../../middleware/authMiddleware');
const { requireRoles } = require('../../middleware/roleMiddleware');

// Configuration multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'artisan-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

// ✅ CORRECTION : Supprimer le préfixe '/profile' car déjà dans index.js
router.patch('/',
  authRequired,
  requireRoles('ARTISAN'),
  upload.single('profileImage'),
  artisanProfileController.updateProfile
);

router.get('/my-profile',
  authRequired,
  requireRoles('ARTISAN'),
  artisanProfileController.getMyProfile
);

router.patch('/location',
  authRequired,
  requireRoles('ARTISAN'),
  artisanProfileController.updateLocation
);

// Route publique pour voir le profil d'un artisan
router.get('/public/:id',
  artisanProfileController.getPublicProfile
);

module.exports = router;