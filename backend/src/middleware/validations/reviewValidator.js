const { body } = require('express-validator');
const { validate } = require('../validate');

const validateReview = validate([
  body('targetId').notEmpty().withMessage('L\'identifiant de la cible est obligatoire')
    .isMongoId().withMessage('Identifiant de la cible invalide'),
  body('targetType').notEmpty().withMessage('Le type de cible est obligatoire')
    .isIn(['ARTISAN', 'PRESCRIPTEUR']).withMessage('Type invalide — choisissez ARTISAN ou PRESCRIPTEUR'),
  body('rating').notEmpty().withMessage('La note est obligatoire')
    .isInt({ min: 1, max: 5 }).withMessage('La note doit être un nombre entier entre 1 et 5 étoiles'),
  body('comment').optional().trim()
    .isLength({ max: 500 }).withMessage('Le commentaire ne peut pas dépasser 500 caractères')
    .escape(),
  body('sourceId').optional()
    .isMongoId().withMessage('Identifiant de la demande invalide'),
]);

module.exports = { validateReview };
