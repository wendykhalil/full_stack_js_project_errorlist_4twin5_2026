const { body } = require('express-validator');
const { handleValidationErrors } = require('../validate');

const validateProject = [
  body('title').trim()
    .notEmpty().withMessage('Le titre du projet est obligatoire')
    .isLength({ min: 3, max: 100 }).withMessage('Le titre doit contenir entre 3 et 100 caractères')
    .matches(/^[^<>]*$/).withMessage('Les balises HTML ne sont pas autorisées dans le titre'),
  body('description').optional()
    .isLength({ max: 2000 }).withMessage('La description ne peut pas dépasser 2000 caractères')
    .matches(/^[^<>]*$/).withMessage('Les balises HTML ne sont pas autorisées dans la description'),
  body('budget')
    .isFloat({ min: 0 }).withMessage('Le budget doit être un nombre positif ou zéro (ex: 15000)'),
  body('deadline').optional()
    .isISO8601().withMessage('Date invalide — utilisez le format AAAA-MM-JJ (ex: 2026-12-31)')
    .custom(value => new Date(value) > new Date()).withMessage('La date limite doit être dans le futur'),
  handleValidationErrors
];

module.exports = { validateProject };
