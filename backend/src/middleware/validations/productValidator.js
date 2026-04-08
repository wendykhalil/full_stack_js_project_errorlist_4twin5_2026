const { body } = require('express-validator');
const { handleValidationErrors } = require('../validate');

const validateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nom requis')
    .isLength({ max: 100 }).withMessage('Nom trop long'),
  body('price')
    .isFloat({ min: 0.01 }).withMessage('Prix invalide (≥ 0.01)')
    .toFloat(),
  body('stock')
    .isInt({ min: 0 }).withMessage('Stock doit être un entier ≥ 0')
    .toInt(),
  body('categoryId')
    .optional()
    .isMongoId().withMessage('ID catégorie invalide'),
  handleValidationErrors
];

module.exports = { validateProduct };