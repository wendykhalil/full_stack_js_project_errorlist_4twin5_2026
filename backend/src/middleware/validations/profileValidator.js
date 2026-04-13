const { body } = require('express-validator');
const { handleValidationErrors } = require('../validate');

const validateProfile = [
  body('firstName').trim()
    .isLength({ min: 2, max: 50 }).withMessage('Le prénom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s\-]+$/).withMessage('Le prénom doit contenir uniquement des lettres, espaces et tirets'),
  body('lastName').trim()
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s\-]+$/).withMessage('Le nom doit contenir uniquement des lettres, espaces et tirets'),
  body('email')
    .isEmail().withMessage('Adresse email invalide (ex: nom@domaine.com)')
    .normalizeEmail(),
  body('phone').optional()
    .matches(/^(\+216)?[0-9]{8}$/).withMessage('Numéro tunisien invalide — 8 chiffres requis (ex: 22345678 ou +21622345678)'),
  body('bio').optional()
    .isLength({ max: 500 }).withMessage('La biographie ne peut pas dépasser 500 caractères')
    .matches(/^[^<>]*$/).withMessage('Les balises HTML ne sont pas autorisées dans la biographie'),
  handleValidationErrors
];

module.exports = { validateProfile };
