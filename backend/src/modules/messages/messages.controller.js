const messagesService = require('./messages.service');
const apiResponse = require('../../utils/apiResponse');

// Envoyer un message (lié à une commande)
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

// ✅ NOUVEAU : Envoyer un message direct (hors commande)
async function sendDirectMessage(req, res) {
  try {
    const { receiverId, content } = req.body;
    
    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Destinataire et contenu requis' });
    }

    const message = await messagesService.sendDirectMessage({
      senderId: req.user._id,
      receiverId,
      content
    });

    return apiResponse(res, 'Message envoyé', message, 201);
  } catch (error) {
    console.error('Error in sendDirectMessage controller:', error);
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

// ✅ NOUVEAU : Récupérer la conversation avec un utilisateur
async function getConversation(req, res) {
  try {
    const { userId } = req.params;
    const { page, limit } = req.query;

    const messages = await messagesService.getConversation(
      req.user._id,
      userId,
      parseInt(page) || 1,
      parseInt(limit) || 50
    );

    return apiResponse(res, 'Conversation récupérée', messages);
  } catch (error) {
    console.error('Error in getConversation controller:', error);
    return res.status(error.statusCode || 500).json({ 
      message: error.message || 'Erreur lors du chargement de la conversation' 
    });
  }
}

// ✅ NOUVEAU : Récupérer les conversations récentes
async function getRecentConversations(req, res) {
  try {
    const conversations = await messagesService.getRecentConversations(req.user._id);
    return apiResponse(res, 'Conversations récentes', conversations);
  } catch (error) {
    console.error('Error in getRecentConversations controller:', error);
    return res.status(error.statusCode || 500).json({ 
      message: error.message || 'Erreur lors du chargement des conversations' 
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
    return apiResponse(res, 'Messages non lus', { count });
  } catch (error) {
    console.error('Error in getUnreadCount controller:', error);
    return res.status(error.statusCode || 500).json({ 
      message: error.message || 'Erreur lors du comptage des messages' 
    });
  }
}

module.exports = {
  sendMessage,
  sendDirectMessage,  // ✅ NOUVEAU
  getOrderMessages,
  getConversation,     // ✅ NOUVEAU
  getRecentConversations, // ✅ NOUVEAU
  markAsRead,
  getUnreadCount
};