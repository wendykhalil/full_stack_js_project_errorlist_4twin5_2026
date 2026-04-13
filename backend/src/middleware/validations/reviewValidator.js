const { body } = require('express-validator');
const { validate } = require('../validate');

const validateReview = validate([
  body('targetId').notEmpty().withMessage('targetId est requis')
    .isMongoId().withMessage('targetId invalide'),
  body('targetType').notEmpty().withMessage('targetType est requis')
    .isIn(['ARTISAN', 'PRESCRIPTEUR']).withMessage('targetType doit être ARTISAN ou PRESCRIPTEUR'),
  body('rating').notEmpty().withMessage('La note est requise')
    .isInt({ min: 1, max: 5 }).withMessage('La note doit être entre 1 et 5'),
  body('comment').optional().trim()
    .isLength({ max: 500 }).withMessage('Commentaire max 500 caractères')
    .escape(),
  body('sourceId').optional()
    .isMongoId().withMessage('sourceId invalide'),
]);

module.exports = { validateReview };
