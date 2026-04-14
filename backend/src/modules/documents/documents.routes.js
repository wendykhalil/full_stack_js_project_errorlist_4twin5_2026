const express = require('express');
const { authRequired } = require('../../middleware/authMiddleware');
const { requireRoles } = require('../../middleware/roleMiddleware');
const { allowOneTrialOrActiveSubscription } = require('../../middleware/trialMiddleware');
const controller = require('./documents.controller');

const router = express.Router();
router.use(authRequired, requireRoles('ARTISAN'));

router.get('/my', controller.listMyDocuments);
router.get('/activity', controller.listMyDocumentActivity);
router.post('/quotes', allowOneTrialOrActiveSubscription('quoteCreated'), controller.createQuote);
router.post('/invoices', allowOneTrialOrActiveSubscription('invoiceCreated'), controller.createInvoice);

module.exports = router;
