const express = require('express');
const router = express.Router();
const { authRequired } = require('../../middleware/authMiddleware');
const { requireRoles } = require('../../middleware/roleMiddleware');
const ctrl = require('./subscription.controller');

router.get('/me', authRequired, ctrl.getMySubscription);
router.get('/public/:userId', ctrl.getPublicPlan);
router.post('/cancel', authRequired, requireRoles('ARTISAN'), ctrl.cancelMySubscription);
router.post('/trial', authRequired, requireRoles('ARTISAN'), ctrl.startTrial);
router.post('/:userId/authorize', authRequired, requireRoles('ADMIN'), ctrl.authorizeUserSubscription);

module.exports = router;
