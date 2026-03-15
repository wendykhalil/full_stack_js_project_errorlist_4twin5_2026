const express = require('express');
const router = express.Router();
const messagesController = require('./messages.controller');
const { authRequired } = require('../../middleware/authMiddleware');

router.post('/', authRequired, messagesController.sendMessage);
router.get('/order/:orderId', authRequired, messagesController.getOrderMessages);
router.patch('/:id/read', authRequired, messagesController.markAsRead);
router.get('/unread/count', authRequired, messagesController.getUnreadCount);

module.exports = router;