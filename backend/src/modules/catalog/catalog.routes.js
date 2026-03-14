const express = require('express');
const router = express.Router();
const { getProducts } = require('./catalog.controller');

// Public catalog products (marketplace)
router.get('/products', getProducts);

module.exports = router;
