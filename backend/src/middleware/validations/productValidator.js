const { body } = require('express-validator');
const { handleValidationErrors } = require('../validate');

const validateProduct = [
  body('name').trim()
    .notEmpty().withMessage('Le nom du produit est obligatoire')
    .isLength({ max: 100 }).withMessage('Le nom du produit ne peut pas dépasser 100 caractères'),
  body('price')
    .isFloat({ min: 0.01 }).withMessage('Le prix doit être un nombre positif supérieur à 0 (ex: 29.99)')
    .toFloat(),
  body('stock')
    .isInt({ min: 0 }).withMessage('Le stock doit être un nombre entier positif ou zéro (ex: 50)')
    .toInt(),
  body('categoryId').optional()
    .isMongoId().withMessage('Identifiant de catégorie invalide'),
  handleValidationErrors
];

module.exports = { validateProduct };
