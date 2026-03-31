const express = require('express');
const router = express.Router();
const { getProducts, rateProduct } = require('./catalog.controller');
const { authRequired } = require('../../middleware/authMiddleware');
const { requireRoles } = require('../../middleware/roleMiddleware');

// Public catalog products (marketplace)
router.get('/products', getProducts);
router.post('/products/:id/rate', authRequired, requireRoles('ARTISAN', 'PRESCRIPTEUR'), rateProduct);

module.exports = router;
