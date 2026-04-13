const { body } = require('express-validator');
const { validate } = require('../validate');

const TRADES = ['Plombier','Électricien','Maçon','Peintre','Menuisier','Carreleur','Chauffagiste','Climatisation','Jardinier','Autre'];
const ROLES  = ['ARTISAN','PRESCRIPTEUR','SUPPLIER'];

const validateRegister = validate([
  body('firstName').trim().notEmpty().withMessage('Le prénom est obligatoire')
    .isLength({ min: 2, max: 60 }).withMessage('Le prénom doit contenir entre 2 et 60 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s\-]+$/).withMessage('Le prénom doit contenir uniquement des lettres'),
  body('lastName').trim().notEmpty().withMessage('Le nom est obligatoire')
    .isLength({ min: 2, max: 60 }).withMessage('Le nom doit contenir entre 2 et 60 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s\-]+$/).withMessage('Le nom doit contenir uniquement des lettres'),
  body('email').trim().notEmpty().withMessage('L\'adresse email est obligatoire')
    .isEmail().withMessage('Adresse email invalide (ex: nom@domaine.com)')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Le mot de passe est obligatoire')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une lettre majuscule')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre'),
  body('phone').notEmpty().withMessage('Le numéro de téléphone est obligatoire')
    .matches(/^\+?[\d\s\-().]{6,15}$/).withMessage('Numéro invalide — chiffres uniquement, entre 6 et 15 chiffres'),
  body('role').notEmpty().withMessage('Le rôle est obligatoire')
    .isIn(ROLES).withMessage(`Rôle invalide. Valeurs acceptées: ${ROLES.join(', ')}`),
]);

const validateLogin = validate([
  body('email').trim().notEmpty().withMessage('L\'email ou le téléphone est obligatoire'),
  body('password').notEmpty().withMessage('Le mot de passe est obligatoire'),
]);

const validateForgotPassword = validate([
  body('email').trim().notEmpty().withMessage('L\'adresse email est obligatoire')
    .isEmail().withMessage('Adresse email invalide (ex: nom@domaine.com)'),
]);

const validateResetPassword = validate([
  body('token').notEmpty().withMessage('Token manquant ou invalide'),
  body('newPassword').notEmpty().withMessage('Le nouveau mot de passe est obligatoire')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
]);

const validateChangePassword = validate([
  body('currentPassword').notEmpty().withMessage('Le mot de passe actuel est obligatoire'),
  body('newPassword').notEmpty().withMessage('Le nouveau mot de passe est obligatoire')
    .isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères'),
]);

const validateUpdateProfile = validate([
  body('firstName').optional().trim()
    .isLength({ min: 2, max: 60 }).withMessage('Le prénom doit contenir entre 2 et 60 caractères'),
  body('lastName').optional().trim()
    .isLength({ min: 2, max: 60 }).withMessage('Le nom doit contenir entre 2 et 60 caractères'),
  body('phone').optional()
    .matches(/^\+?[\d\s\-().]{6,15}$/).withMessage('Numéro invalide — chiffres uniquement, entre 6 et 15 chiffres'),
]);

module.exports = {
  validateRegister, validateLogin, validateForgotPassword,
  validateResetPassword, validateChangePassword, validateUpdateProfile,
};
