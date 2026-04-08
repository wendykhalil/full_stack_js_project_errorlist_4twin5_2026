const { body } = require('express-validator');
const { handleValidationErrors } = require('../validate');

const validateProject = [
  body('title')
    .trim()
    .notEmpty().withMessage('Le titre est requis')
    .isLength({ min: 3, max: 100 }).withMessage('Titre 3‑100 caractères')
    .matches(/^[^<>]*$/).withMessage('HTML interdit'),
  body('description')
    .optional()
    .isLength({ max: 2000 }).withMessage('Description trop longue')
    .matches(/^[^<>]*$/),
  body('budget')
    .isFloat({ min: 0 }).withMessage('Budget doit être ≥ 0'),
  body('deadline')
    .optional()
    .isISO8601().withMessage('Date invalide')
    .custom(value => new Date(value) > new Date()).withMessage('La date doit être future'),
  handleValidationErrors
];

module.exports = { validateProject };