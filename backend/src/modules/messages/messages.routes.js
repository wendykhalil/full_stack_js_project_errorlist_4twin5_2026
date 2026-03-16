const express = require('express');
const router = express.Router();
const messagesController = require('./messages.controller');
const { authRequired } = require('../../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(authRequired);

// Envoyer un message (lié à une commande)
router.post('/', messagesController.sendMessage);

// ✅ NOUVEAU : Envoyer un message direct
router.post('/direct', messagesController.sendDirectMessage);

// Récupérer les messages d'une commande
router.get('/order/:orderId', messagesController.getOrderMessages);

// ✅ NOUVEAU : Récupérer la conversation avec un utilisateur
router.get('/conversation/:userId', messagesController.getConversation);

// ✅ NOUVEAU : Récupérer les conversations récentes
router.get('/recent', messagesController.getRecentConversations);

// Marquer un message comme lu
router.patch('/:id/read', messagesController.markAsRead);

// Compter les messages non lus
router.get('/unread/count', messagesController.getUnreadCount);

module.exports = router;