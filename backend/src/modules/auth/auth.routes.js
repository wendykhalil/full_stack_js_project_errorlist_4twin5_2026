const express = require('express');
const { authRequired } = require('../../middleware/authMiddleware');
const controller = require('./auth.controller');
const { uploadProfileMedia } = require('../../middleware/uploadProfileMedia');
const {
  validateRegister, validateLogin, validateForgotPassword,
  validateResetPassword, validateChangePassword, validateUpdateProfile,
} = require('../../middleware/validations/auth.validation');

const router = express.Router();

router.post('/register', validateRegister, controller.register);
router.get('/verify-email', controller.verifyEmail);
router.post('/resend-verification', controller.resendVerification);
router.post('/login', validateLogin, controller.login);
router.post('/google', controller.googleLogin);
router.post('/logout', authRequired, controller.logout);
router.post('/phone/start', controller.phoneStart);
router.post('/phone/verify', controller.phoneVerify);
router.post('/set-role', authRequired, controller.setRole);
router.get('/me', authRequired, controller.me);
router.patch('/profile', authRequired, uploadProfileMedia, validateUpdateProfile, controller.updateProfile);
router.post('/change-password', authRequired, validateChangePassword, controller.changePassword);
router.post('/forgot-password', validateForgotPassword, controller.forgotPassword);
router.post('/reset-password', validateResetPassword, controller.resetPassword);

module.exports = router;
