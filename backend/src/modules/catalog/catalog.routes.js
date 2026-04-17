const express = require('express');
const router = express.Router();
const { getProducts, getProductById, getRecommendations, getVideo, rateProduct } = require('./catalog.controller');
const { authRequired } = require('../../middleware/authMiddleware');
const { requireRoles } = require('../../middleware/roleMiddleware');

// Public catalog
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.get('/products/:id/recommendations', getRecommendations);
router.get('/products/:id/video', getVideo);
router.post('/products/:id/rate', authRequired, requireRoles('ARTISAN', 'PRESCRIPTEUR'), rateProduct);

module.exports = router;
