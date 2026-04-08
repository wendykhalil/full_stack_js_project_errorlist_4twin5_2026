const { body } = require('express-validator');
const { handleValidationErrors } = require('../validate');

const validateProfile = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Prénom 2‑50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s\-]+$/).withMessage('Caractères non autorisés'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Nom 2‑50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s\-]+$/),
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^(\+216)?[0-9]{8}$/).withMessage('Téléphone invalide (8 chiffres ou +216...)'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .matches(/^[^<>]*$/),
  handleValidationErrors
];

module.exports = { validateProfile };