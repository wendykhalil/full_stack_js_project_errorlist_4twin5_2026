const { body, param } = require('express-validator');
const { validate } = require('../validate');

const TRADES = ['Plombier','Électricien','Maçon','Peintre','Menuisier','Carreleur','Chauffagiste','Climatisation','Jardinier','Autre'];

const validateCreateServiceRequest = validate([
  body('title').trim().notEmpty().withMessage('Le titre est requis')
    .isLength({ min: 3, max: 120 }).withMessage('Titre entre 3 et 120 caractères')
    .escape(),
  body('description').optional().trim()
    .isLength({ max: 2000 }).withMessage('Description max 2000 caractères')
    .escape(),
  body('trade').notEmpty().withMessage('Le métier est requis')
    .isIn(TRADES).withMessage(`Métier invalide. Valeurs: ${TRADES.join(', ')}`),
  body('city').optional().trim()
    .isLength({ max: 80 }).withMessage('Ville max 80 caractères')
    .escape(),
  body('budgetTND').optional()
    .isFloat({ min: 0 }).withMessage('Budget doit être un nombre positif'),
  body('deadline').optional()
    .isISO8601().withMessage('Date invalide (format ISO8601 requis)')
    .custom(v => new Date(v) > new Date()).withMessage('La date limite doit être dans le futur'),
]);

const validateUpdateServiceRequest = validate([
  body('title').optional().trim()
    .isLength({ min: 3, max: 120 }).withMessage('Titre entre 3 et 120 caractères')
    .escape(),
  body('description').optional().trim()
    .isLength({ max: 2000 }).withMessage('Description max 2000 caractères')
    .escape(),
  body('trade').optional()
    .isIn(TRADES).withMessage(`Métier invalide`),
  body('budgetTND').optional()
    .isFloat({ min: 0 }).withMessage('Budget doit être un nombre positif'),
  body('deadline').optional()
    .isISO8601().withMessage('Date invalide'),
]);

const validateApply = validate([
  body('message').optional().trim()
    .isLength({ max: 500 }).withMessage('Message max 500 caractères')
    .escape(),
  body('proposedPrice').optional()
    .isFloat({ min: 0 }).withMessage('Prix proposé doit être positif'),
]);

module.exports = { validateCreateServiceRequest, validateUpdateServiceRequest, validateApply };
