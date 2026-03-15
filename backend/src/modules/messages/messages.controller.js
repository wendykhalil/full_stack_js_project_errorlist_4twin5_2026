const messagesService = require('./messages.service');
const apiResponse = require('../../utils/apiResponse');

// Envoyer un message
async function sendMessage(req, res, next) {
  try {
    const messageData = {
      ...req.body,
      senderId: req.user._id
    };
    const message = await messagesService.sendMessage(messageData);
    apiResponse(res, 'Message envoyé', message, 201);
  } catch (error) {
    next(error);
  }
}

// Récupérer les messages d'une commande
async function getOrderMessages(req, res, next) {
  try {
    const { orderId } = req.params;
    const messages = await messagesService.getOrderMessages(orderId, req.user._id);
    apiResponse(res, 'Messages récupérés', messages);
  } catch (error) {
    next(error);
  }
}

// Marquer un message comme lu
async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const message = await messagesService.markAsRead(id, req.user._id);
    apiResponse(res, 'Message marqué comme lu', message);
  } catch (error) {
    next(error);
  }
}

// Récupérer les conversations non lues
async function getUnreadCount(req, res, next) {
  try {
    const count = await messagesService.getUnreadCount(req.user._id);
    apiResponse(res, 'Nombre de messages non lus', { count });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendMessage,
  getOrderMessages,
  markAsRead,
  getUnreadCount
};