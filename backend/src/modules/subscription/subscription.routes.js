const express = require('express');
const router = express.Router();
const { authRequired } = require('../../middleware/authMiddleware');
const { requireRoles } = require('../../middleware/roleMiddleware');
const { getMySubscription, authorizeUserSubscription } = require('./subscription.controller');

router.get('/me', authRequired, getMySubscription);
router.post('/:userId/authorize', authRequired, requireRoles('ADMIN'), authorizeUserSubscription);

module.exports = router;
