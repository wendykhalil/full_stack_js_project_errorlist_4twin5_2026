const Message = require('../../models/Message');
const Order = require('../../models/Order');

// Envoyer un message
async function sendMessage({ orderId, receiverId, content, attachments = [] }) {
  // Vérifier que la commande existe
  const order = await Order.findById(orderId);
  if (!order) {
    const error = new Error('Commande non trouvée');
    error.statusCode = 404;
    throw error;
  }

  const message = new Message({
    orderId,
    senderId,
    receiverId,
    content,
    attachments
  });

  await message.save();
  
  await message.populate('senderId', 'firstName lastName');
  
  return message;
}

// Récupérer les messages d'une commande
async function getOrderMessages(orderId, userId) {
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
}

// Marquer un message comme lu
async function markAsRead(messageId, userId) {
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
}

// Compter les messages non lus
async function getUnreadCount(userId) {
  return await Message.countDocuments({
    receiverId: userId,
    read: false
  });
}

module.exports = {
  sendMessage,
  getOrderMessages,
  markAsRead,
  getUnreadCount
};