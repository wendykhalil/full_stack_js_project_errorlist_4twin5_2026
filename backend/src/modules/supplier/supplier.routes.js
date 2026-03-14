const express = require('express');
const router = express.Router();
const {
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getStats,
  getCategories
} = require('./supplier.controller');
const { authRequired } = require('../../middleware/authMiddleware');
const { requireRoles } = require('../../middleware/roleMiddleware');
const uploadProducts = require('../../middleware/uploadProducts');

// Routes
router.get('/products', authRequired, requireRoles('SUPPLIER'), getMyProducts);
router.post('/products', authRequired, requireRoles('SUPPLIER'), uploadProducts.uploadProductMedia, createProduct);
router.put('/products/:id', authRequired, requireRoles('SUPPLIER'), uploadProducts.uploadProductMedia, updateProduct);
router.delete('/products/:id', authRequired, requireRoles('SUPPLIER'), deleteProduct);
router.get('/categories', authRequired, requireRoles('SUPPLIER'), getCategories);
router.get('/stats', authRequired, requireRoles('SUPPLIER'), getStats);

module.exports = router;