const express = require('express');
const { authRequired } = require('../../middleware/authMiddleware');
const { requireRoles } = require('../../middleware/roleMiddleware');
const controller = require('./documents.controller');

const router = express.Router();
router.use(authRequired, requireRoles('ARTISAN'));

router.get('/my', controller.listMyDocuments);
router.post('/quotes', controller.createQuote);
router.post('/invoices', controller.createInvoice);

module.exports = router;
