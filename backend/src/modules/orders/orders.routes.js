const express = require('express');
const router = express.Router();
const ordersController = require('./orders.controller');
const { authRequired } = require('../../middleware/authMiddleware');
const { requireRoles } = require('../../middleware/roleMiddleware');

// Routes pour les artisans
router.post('/', authRequired, requireRoles('ARTISAN'), ordersController.createOrder);
router.get('/my-orders', authRequired, requireRoles('ARTISAN'), ordersController.getMyOrders);
router.post('/:id/review', authRequired, requireRoles('ARTISAN'), ordersController.submitReview);

// Routes pour les fournisseurs
router.get('/supplier', authRequired, requireRoles('SUPPLIER'), ordersController.getSupplierOrders);
router.patch('/:id/status', authRequired, requireRoles('SUPPLIER'), ordersController.updateOrderStatus);
router.post('/:id/note', authRequired, requireRoles('SUPPLIER'), ordersController.addSupplierNote);

// Route commune (accessible par les deux rôles)
router.get('/:id', authRequired, ordersController.getOrderById);
router.get('/artisan/active', authRequired, requireRoles('ARTISAN'), ordersController.getArtisanActiveOrders);
router.get('/artisan/history', authRequired, requireRoles('ARTISAN'), ordersController.getArtisanOrderHistory);
router.get('/supplier/active', authRequired, requireRoles('SUPPLIER'), ordersController.getSupplierActiveOrders);
router.get('/supplier/history', authRequired, requireRoles('SUPPLIER'), ordersController.getSupplierOrderHistory);

module.exports = router;
