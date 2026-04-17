const express = require('express');
const router = express.Router();
const { getProducts, getProductById, getRecommendations, getVideo } = require('./catalog.controller');

// Public catalog
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.get('/products/:id/recommendations', getRecommendations);
router.get('/products/:id/video', getVideo);

module.exports = router;
