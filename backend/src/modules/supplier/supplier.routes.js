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
const { getAiInsights, retrainAiModel } = require('./aiInsights.service');
const { getModelMeta } = require('./ml.client');

// ── Product CRUD ──────────────────────────────────────────────────────────────
router.get('/products', authRequired, requireRoles('SUPPLIER'), getMyProducts);
router.post('/products', authRequired, requireRoles('SUPPLIER'), uploadProducts.uploadProductMedia, createProduct);
router.put('/products/:id', authRequired, requireRoles('SUPPLIER'), uploadProducts.uploadProductMedia, updateProduct);
router.delete('/products/:id', authRequired, requireRoles('SUPPLIER'), deleteProduct);
router.get('/categories', authRequired, requireRoles('SUPPLIER'), getCategories);
router.get('/stats', authRequired, requireRoles('SUPPLIER'), getStats);

// ── AI Insights ───────────────────────────────────────────────────────────────
router.get('/ai-insights', authRequired, requireRoles('SUPPLIER'), async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const insights = await getAiInsights(req.user._id, forceRefresh);
    res.json({ ok: true, ...insights });
  } catch (err) {
    res.status(503).json({ ok: false, message: err.message });
  }
});

// ── AI Retrain ────────────────────────────────────────────────────────────────
router.post('/ai-retrain', authRequired, requireRoles('SUPPLIER'), async (req, res) => {
  try {
    const result = await retrainAiModel(req.user._id);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(503).json({ ok: false, message: err.message });
  }
});

// ── Model metadata ────────────────────────────────────────────────────────────
router.get('/ai-model-meta', authRequired, requireRoles('SUPPLIER'), async (req, res) => {
  try {
    const meta = await getModelMeta();
    res.json({ ok: true, meta });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
