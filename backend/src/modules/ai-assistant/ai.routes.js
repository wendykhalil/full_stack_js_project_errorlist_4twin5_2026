const express = require('express');
const controller = require('./ai.controller');
const { authRequired } = require('../../middleware/authMiddleware');
const { requireRoles } = require('../../middleware/roleMiddleware');

const router = express.Router();

router.get('/smart-search', controller.smartSearch);
router.post('/suggest/project', authRequired, controller.suggestProject);
router.post('/suggest/product', authRequired, controller.suggestProduct);
router.post('/quote/from-project', authRequired, requireRoles('ARTISAN'), controller.suggestQuoteFromProject);

module.exports = router;
