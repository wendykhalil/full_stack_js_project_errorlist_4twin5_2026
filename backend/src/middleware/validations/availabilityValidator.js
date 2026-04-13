const { body, param } = require('express-validator');
const { validate } = require('../validate');

const validateUpsertAvailability = validate([
  body('date').notEmpty().withMessage('La date est obligatoire')
    .isISO8601().withMessage('Date invalide — utilisez le format AAAA-MM-JJ (ex: 2026-05-15)'),
  body('status').optional()
    .isIn(['AVAILABLE', 'BUSY', 'BOOKED'])
    .withMessage('Statut invalide — choisissez: AVAILABLE (disponible), BUSY (occupé) ou BOOKED (réservé)'),
  body('note').optional().trim()
    .isLength({ max: 200 }).withMessage('La note ne peut pas dépasser 200 caractères')
    .escape(),
]);

const validateDateParam = validate([
  param('date').isISO8601().withMessage('Date invalide dans l\'URL — utilisez le format AAAA-MM-JJ'),
]);

module.exports = { validateUpsertAvailability, validateDateParam };
