const express = require('express');
const router = express.Router();
const ctrl = require('./notifications.controller');
const { authRequired } = require('../../middleware/authMiddleware');

router.get('/', authRequired, ctrl.list);
router.get('/unread-count', authRequired, ctrl.unreadCount);
router.patch('/read-all', authRequired, ctrl.markAllRead);  // must be before /:id
router.patch('/:id/read', authRequired, ctrl.markRead);
router.delete('/:id', authRequired, ctrl.remove);

module.exports = router;
