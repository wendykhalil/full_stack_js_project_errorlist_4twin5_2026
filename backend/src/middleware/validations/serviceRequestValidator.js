const { body, param } = require('express-validator');
const { validate } = require('../validate');

const TRADES = ['Plombier','Électricien','Maçon','Peintre','Menuisier','Carreleur','Chauffagiste','Climatisation','Jardinier','Autre'];

const validateCreateServiceRequest = validate([
  body('title').trim().notEmpty().withMessage('Le titre est obligatoire')
    .isLength({ min: 3, max: 120 }).withMessage('Le titre doit contenir entre 3 et 120 caractères'),
    
  body('description').optional().trim()
    .isLength({ max: 2000 }).withMessage('La description ne peut pas dépasser 2000 caractères'),
    
  body('trade').notEmpty().withMessage('Le métier est obligatoire')
    .isIn(TRADES).withMessage(`Métier invalide. Valeurs acceptées: ${TRADES.join(', ')}`),
  body('city').optional().trim()
    .isLength({ max: 80 }).withMessage('La ville ne peut pas dépasser 80 caractères'),
    
  body('budgetTND').optional()
    .isFloat({ min: 0 }).withMessage('Le budget doit être un nombre positif (ex: 1500)'),
  body('deadline').optional()
    .isISO8601().withMessage('Date invalide — utilisez le format AAAA-MM-JJ')
    .custom(v => new Date(v) > new Date()).withMessage('La date limite doit être dans le futur'),
]);

const validateUpdateServiceRequest = validate([
  body('title').optional().trim()
    .isLength({ min: 3, max: 120 }).withMessage('Le titre doit contenir entre 3 et 120 caractères'),
    
  body('description').optional().trim()
    .isLength({ max: 2000 }).withMessage('La description ne peut pas dépasser 2000 caractères'),
    
  body('trade').optional()
    .isIn(TRADES).withMessage(`Métier invalide. Valeurs acceptées: ${TRADES.join(', ')}`),
  body('budgetTND').optional()
    .isFloat({ min: 0 }).withMessage('Le budget doit être un nombre positif (ex: 1500)'),
  body('deadline').optional()
    .isISO8601().withMessage('Date invalide — utilisez le format AAAA-MM-JJ'),
]);

const validateApply = validate([
  body('message').optional().trim()
    .isLength({ max: 500 }).withMessage('Le message ne peut pas dépasser 500 caractères'),
    
  body('proposedPrice').notEmpty().withMessage('Le prix proposé est obligatoire')
    .isFloat({ min: 0 }).withMessage('Le prix proposé doit être un nombre positif (ex: 2500)'),
]);

module.exports = { validateCreateServiceRequest, validateUpdateServiceRequest, validateApply };
