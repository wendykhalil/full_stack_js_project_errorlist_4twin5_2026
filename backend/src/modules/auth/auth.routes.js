const express = require('express');
const { authRequired } = require('../../middleware/authMiddleware');
const controller = require('./auth.controller');

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
router.patch('/profile', authRequired, controller.updateProfile);
router.post('/change-password', authRequired, controller.changePassword);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

module.exports = router;
