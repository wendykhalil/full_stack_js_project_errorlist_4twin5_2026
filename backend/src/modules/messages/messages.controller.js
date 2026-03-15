const messagesService = require('./messages.service');
const apiResponse = require('../../utils/apiResponse');

// Envoyer un message
async function sendMessage(req, res) {
  try {
    console.log('Sending message with data:', req.body);
    console.log('User:', req.user._id);
    
    const messageData = {
      ...req.body,
      senderId: req.user._id
    };
    
    const message = await messagesService.sendMessage(messageData);
    return apiResponse(res, 'Message envoyé', message, 201);
  } catch (error) {
    console.error('Error in sendMessage controller:', error);
    return res.status(error.statusCode || 500).json({ 
      message: error.message || 'Erreur lors de l\'envoi du message' 
    });
  }
}

// Récupérer les messages d'une commande
async function getOrderMessages(req, res) {
  try {
    const { orderId } = req.params;
    const messages = await messagesService.getOrderMessages(orderId, req.user._id);
    return apiResponse(res, 'Messages récupérés', messages);
  } catch (error) {
    console.error('Error in getOrderMessages controller:', error);
    return res.status(error.statusCode || 500).json({ 
      message: error.message || 'Erreur lors du chargement des messages' 
    });
  }
}

// Marquer un message comme lu
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const message = await messagesService.markAsRead(id, req.user._id);
    return apiResponse(res, 'Message marqué comme lu', message);
  } catch (error) {
    console.error('Error in markAsRead controller:', error);
    return res.status(error.statusCode || 500).json({ 
      message: error.message || 'Erreur lors du marquage du message' 
    });
  }
}

// Récupérer les conversations non lues
async function getUnreadCount(req, res) {
  try {
    const count = await messagesService.getUnreadCount(req.user._id);
    return apiResponse(res, 'Nombre de messages non lus', { count });
  } catch (error) {
    console.error('Error in getUnreadCount controller:', error);
    return res.status(error.statusCode || 500).json({ 
      message: error.message || 'Erreur lors du comptage des messages' 
    });
  }
}

module.exports = {
  sendMessage,
  getOrderMessages,
  markAsRead,
  getUnreadCount
};