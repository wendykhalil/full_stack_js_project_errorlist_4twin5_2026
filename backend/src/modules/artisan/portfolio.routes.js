const express = require('express');
const router = express.Router();
const multer = require('multer');
const portfolioController = require('./portfolio.controller');
const { authRequired } = require('../../middleware/authMiddleware');
const { requireRoles } = require('../../middleware/roleMiddleware');
const { allowOneTrialOrActiveSubscription } = require('../../middleware/trialMiddleware');

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

router.post('/',
  authRequired,
  requireRoles('ARTISAN'),
  allowOneTrialOrActiveSubscription('portfolioCreated'),
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
  allowOneTrialOrActiveSubscription('portfolioCreated'),
  upload.array('images', 10),
  portfolioController.updateProject
);

router.delete('/:id',
  authRequired,
  requireRoles('ARTISAN'),
  allowOneTrialOrActiveSubscription('portfolioCreated'),
  portfolioController.deleteProject
);

router.get('/public/:artisanId',
  portfolioController.getPublicPortfolio
);

module.exports = router;
