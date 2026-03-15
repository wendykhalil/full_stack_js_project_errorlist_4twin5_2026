const express = require('express');
const { authRequired } = require('../../middleware/authMiddleware');
const controller = require('./auth.controller');
const multer = require('multer'); // Ajoute cette ligne
const path = require('path'); // Ajoute cette ligne

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

const router = express.Router();

router.post('/register', controller.register);
router.get('/verify-email', controller.verifyEmail);
router.post('/resend-verification', controller.resendVerification);
router.post('/login', controller.login);
router.post('/google', controller.googleLogin);
router.post('/logout', authRequired, controller.logout);
router.post('/phone/start', controller.phoneStart);
router.post('/phone/verify', controller.phoneVerify);
router.post('/set-role', authRequired, controller.setRole);
router.get('/me', authRequired, controller.me);
router.patch('/profile', authRequired, upload.single('logo'), controller.updateProfile); // Ajout de multer ici
router.post('/change-password', authRequired, controller.changePassword);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

module.exports = router;