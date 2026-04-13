const { body } = require('express-validator');
const { validate } = require('../validate');

const validateCreatePromo = validate([
  body('code').trim().notEmpty().withMessage('Le code promo est obligatoire')
    .isLength({ min: 2, max: 30 }).withMessage('Le code doit contenir entre 2 et 30 caractères')
    .matches(/^[A-Z0-9_-]+$/).withMessage('Le code doit contenir uniquement des lettres majuscules, chiffres, tirets (-) et underscores (_)'),
  body('discountPercent').notEmpty().withMessage('La remise est obligatoire')
    .isInt({ min: 1, max: 100 }).withMessage('La remise doit être un nombre entier entre 1% et 100%'),
  body('maxUses').optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Le nombre d\'utilisations maximum doit être au moins 1'),
  body('expiresAt').optional({ nullable: true })
    .isISO8601().withMessage('Date d\'expiration invalide — utilisez le format AAAA-MM-JJ'),
  body('isActive').optional()
    .isBoolean().withMessage('Le statut actif doit être vrai ou faux'),
  body('appliesTo').optional()
    .isIn(['both', 'monthly', 'yearly']).withMessage('Valeur invalide — choisissez: both, monthly ou yearly'),
]);

const validateUpdatePromo = validate([
  body('discountPercent').optional()
    .isInt({ min: 1, max: 100 }).withMessage('Remise entre 1 et 100%'),
  body('maxUses').optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Utilisations max doit être au moins 1'),
  body('expiresAt').optional({ nullable: true })
    .isISO8601().withMessage('Date d\'expiration invalide'),
  body('isActive').optional()
    .isBoolean().withMessage('isActive doit être true ou false'),
  body('appliesTo').optional()
    .isIn(['both', 'monthly', 'yearly']).withMessage('appliesTo invalide'),
]);

const validatePromoValidate = validate([
  body('code').trim().notEmpty().withMessage('Le code est requis')
    .isLength({ min: 2, max: 30 }).withMessage('Code invalide'),
  body('plan').optional()
    .isIn(['monthly', 'yearly', 'BASIC', 'PRO']).withMessage('Plan invalide'),
]);

module.exports = { validateCreatePromo, validateUpdatePromo, validatePromoValidate };
