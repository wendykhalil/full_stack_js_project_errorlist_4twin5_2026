const { body, param } = require('express-validator');
const { validate } = require('../validate');

const validateUpsertAvailability = validate([
  body('date').notEmpty().withMessage('La date est requise')
    .isISO8601().withMessage('Date invalide (format ISO8601 requis)'),
  body('status').optional()
    .isIn(['AVAILABLE', 'BUSY', 'BOOKED']).withMessage('Statut invalide'),
  body('note').optional().trim()
    .isLength({ max: 200 }).withMessage('Note max 200 caractères')
    .escape(),
]);

const validateDateParam = validate([
  param('date').isISO8601().withMessage('Date invalide dans l\'URL'),
]);

module.exports = { validateUpsertAvailability, validateDateParam };
