/**
 * Marketplace routes — Favorites + Cart + Bulk Checkout
 * All routes require ARTISAN role.
 */
const express = require('express');
const router  = express.Router();
const ctrl    = require('./marketplace.controller');
const { authRequired }  = require('../../middleware/authMiddleware');
const { requireRoles }  = require('../../middleware/roleMiddleware');

const artisan = [authRequired, requireRoles('ARTISAN')];

// ── Favorites ─────────────────────────────────────────────────────────────────
router.get   ('/favorites',            ...artisan, ctrl.getFavorites);
router.post  ('/favorites/:productId', ...artisan, ctrl.toggleFavorite);
router.delete('/favorites/:productId', ...artisan, ctrl.removeFavorite);

// ── Cart ──────────────────────────────────────────────────────────────────────
router.get   ('/cart',            ...artisan, ctrl.getCart);
router.post  ('/cart/add',        ...artisan, ctrl.addToCart);
router.post  ('/cart/remove',     ...artisan, ctrl.removeFromCart);
router.patch ('/cart/update-qty', ...artisan, ctrl.updateQty);
router.delete('/cart',            ...artisan, ctrl.clearCart);

// ── Bulk checkout ─────────────────────────────────────────────────────────────
router.post('/orders/from-cart', ...artisan, ctrl.checkoutCart);

module.exports = router;
