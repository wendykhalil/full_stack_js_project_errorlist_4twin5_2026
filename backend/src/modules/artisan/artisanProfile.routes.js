const express = require('express');
const router = express.Router();
const multer = require('multer');
const artisanProfileController = require('./artisanProfile.controller');
const { authRequired } = require('../../middleware/authMiddleware');
const { requireRoles } = require('../../middleware/roleMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  },
});

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

router.get('/public/:id',
  artisanProfileController.getPublicProfile
);

// DEBUG/TEST ONLY: Reset trial features (remove in production)
router.post('/dev/reset-trials',
  authRequired,
  requireRoles('ARTISAN'),
  artisanProfileController.resetTrialFeatures
);

module.exports = router;
