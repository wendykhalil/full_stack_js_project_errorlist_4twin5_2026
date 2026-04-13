const { body } = require('express-validator');
const { validate } = require('../validate');

const TRADES = ['Plombier','Électricien','Maçon','Peintre','Menuisier','Carreleur','Chauffagiste','Climatisation','Jardinier','Autre'];
const ROLES  = ['ARTISAN','PRESCRIPTEUR','SUPPLIER'];

const validateRegister = validate([
  body('firstName').trim().notEmpty().withMessage('Le prénom est requis')
    .isLength({ min: 2, max: 60 }).withMessage('Prénom entre 2 et 60 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s\-]+$/).withMessage('Prénom: lettres uniquement'),
  body('lastName').trim().notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 60 }).withMessage('Nom entre 2 et 60 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s\-]+$/).withMessage('Nom: lettres uniquement'),
  body('email').trim().notEmpty().withMessage('Email requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Mot de passe requis')
    .isLength({ min: 8 }).withMessage('Minimum 8 caractères')
    .matches(/[A-Z]/).withMessage('Au moins une majuscule')
    .matches(/[0-9]/).withMessage('Au moins un chiffre'),
  body('phone').notEmpty().withMessage('Téléphone requis')
    .matches(/^\+?[\d\s\-().]{6,15}$/).withMessage('Numéro invalide'),
  body('role').notEmpty().withMessage('Rôle requis')
    .isIn(ROLES).withMessage(`Rôle invalide. Valeurs: ${ROLES.join(', ')}`),
]);

const validateLogin = validate([
  body('email').trim().notEmpty().withMessage('Email ou téléphone requis'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
]);

const validateForgotPassword = validate([
  body('email').trim().notEmpty().withMessage('Email requis')
    .isEmail().withMessage('Email invalide'),
]);

const validateResetPassword = validate([
  body('token').notEmpty().withMessage('Token requis'),
  body('newPassword').notEmpty().withMessage('Mot de passe requis')
    .isLength({ min: 6 }).withMessage('Minimum 6 caractères'),
]);

const validateChangePassword = validate([
  body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
  body('newPassword').notEmpty().withMessage('Nouveau mot de passe requis')
    .isLength({ min: 6 }).withMessage('Minimum 6 caractères'),
]);

const validateUpdateProfile = validate([
  body('firstName').optional().trim()
    .isLength({ min: 2, max: 60 }).withMessage('Prénom entre 2 et 60 caractères'),
  body('lastName').optional().trim()
    .isLength({ min: 2, max: 60 }).withMessage('Nom entre 2 et 60 caractères'),
  body('phone').optional()
    .matches(/^\+?[\d\s\-().]{6,15}$/).withMessage('Numéro invalide'),
]);

module.exports = {
  validateRegister, validateLogin, validateForgotPassword,
  validateResetPassword, validateChangePassword, validateUpdateProfile,
};
