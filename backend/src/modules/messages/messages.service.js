const Message = require('../../models/Message');
const Order = require('../../models/Order');

// Envoyer un message
async function sendMessage({ orderId, receiverId, content, senderId, attachments = [] }) {
  try {
    // Vérifier que la commande existe
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error('Commande non trouvée');
      error.statusCode = 404;
      throw error;
    }

    // Vérifier que l'utilisateur a le droit d'envoyer un message
    if (order.artisanId.toString() !== senderId.toString() && 
        order.supplierId.toString() !== senderId.toString()) {
      const error = new Error('Non autorisé à envoyer un message pour cette commande');
      error.statusCode = 403;
      throw error;
    }

    // Créer le message
    const message = new Message({
      orderId,
      senderId,
      receiverId,
      content,
      attachments,
      read: false
    });

    await message.save();
    
    await message.populate('senderId', 'firstName lastName');
    
    return message;
  } catch (error) {
    console.error('Error in sendMessage service:', error);
    throw error;
  }
}

// Récupérer les messages d'une commande
async function getOrderMessages(orderId, userId) {
  try {
    // Vérifier que l'utilisateur a accès à cette commande
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error('Commande non trouvée');
      error.statusCode = 404;
      throw error;
    }

    if (order.artisanId.toString() !== userId.toString() && 
        order.supplierId.toString() !== userId.toString()) {
      const error = new Error('Non autorisé');
      error.statusCode = 403;
      throw error;
    }

    const messages = await Message.find({ orderId })
      .populate('senderId', 'firstName lastName')
      .sort({ createdAt: 1 });

    return messages;
  } catch (error) {
    console.error('Error in getOrderMessages service:', error);
    throw error;
  }
}

// Marquer un message comme lu
async function markAsRead(messageId, userId) {
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      const error = new Error('Message non trouvé');
      error.statusCode = 404;
      throw error;
    }

    // Seul le destinataire peut marquer comme lu
    if (message.receiverId.toString() !== userId.toString()) {
      const error = new Error('Non autorisé');
      error.statusCode = 403;
      throw error;
    }

    message.read = true;
    message.readAt = new Date();
    await message.save();

    return message;
  } catch (error) {
    console.error('Error in markAsRead service:', error);
    throw error;
  }
}

// Compter les messages non lus
async function getUnreadCount(userId) {
  try {
    return await Message.countDocuments({
      receiverId: userId,
      read: false
    });
  } catch (error) {
    console.error('Error in getUnreadCount service:', error);
    throw error;
  }
}

module.exports = {
  sendMessage,
  getOrderMessages,
  markAsRead,
  getUnreadCount
};