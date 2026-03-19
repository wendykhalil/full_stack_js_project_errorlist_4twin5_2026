const Message = require('../../models/Message');
const Order = require('../../models/Order');

function normalizeAttachments(attachments = []) {
  let value = attachments;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      value = JSON.parse(trimmed);
    } catch (_err) {
      return [];
    }
  }

  if (!Array.isArray(value)) return [];

  return value
    .map((attachment) => {
      if (!attachment) return null;
      if (typeof attachment === 'string') {
        try {
          attachment = JSON.parse(attachment);
        } catch (_err) {
          return null;
        }
      }
      if (typeof attachment !== 'object') return null;
      return {
        url: String(attachment.url || '').trim(),
        filename: String(attachment.filename || attachment.originalname || attachment.storedFilename || '').trim(),
        storedFilename: String(attachment.storedFilename || attachment.filename || '').trim(),
        type: String(attachment.type || attachment.mimetype || 'application/octet-stream').trim(),
        size: Number(attachment.size || 0) || 0,
      };
    })
    .filter((attachment) => attachment && attachment.url && attachment.filename);
}

async function sendMessage({ orderId, receiverId, content, senderId, attachments = [] }) {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error('Commande non trouvée');
      error.statusCode = 404;
      throw error;
    }

    if (order.artisanId.toString() !== senderId.toString() && order.supplierId.toString() !== senderId.toString()) {
      const error = new Error('Non autorisé à envoyer un message pour cette commande');
      error.statusCode = 403;
      throw error;
    }

    const normalizedAttachments = normalizeAttachments(attachments);

    const message = new Message({
      orderId,
      senderId,
      receiverId,
      content: String(content || (normalizedAttachments.length ? 'Pièce jointe' : '')).trim(),
      attachments: normalizedAttachments,
      read: false,
    });

    await message.save();
    await message.populate('senderId', 'firstName lastName');
    return message;
  } catch (error) {
    console.error('Error in sendMessage service:', error);
    throw error;
  }
}

async function sendDirectMessage({ receiverId, content, senderId, attachments = [] }) {
  try {
    const normalizedAttachments = normalizeAttachments(attachments);
    const safeContent = String(content || '').trim() || (normalizedAttachments.length ? 'Pièce jointe' : '');

    const message = new Message({
      senderId,
      receiverId,
      content: safeContent,
      attachments: normalizedAttachments,
      read: false,
    });

    await message.save();
    await message.populate('senderId', 'firstName lastName');
    await message.populate('receiverId', 'firstName lastName');
    return message;
  } catch (error) {
    console.error('Error in sendDirectMessage service:', error);
    throw error;
  }
}

async function getOrderMessages(orderId, userId) {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error('Commande non trouvée');
      error.statusCode = 404;
      throw error;
    }

    if (order.artisanId.toString() !== userId.toString() && order.supplierId.toString() !== userId.toString()) {
      const error = new Error('Non autorisé');
      error.statusCode = 403;
      throw error;
    }

    return await Message.find({ orderId }).populate('senderId', 'firstName lastName').sort({ createdAt: 1 });
  } catch (error) {
    console.error('Error in getOrderMessages service:', error);
    throw error;
  }
}

async function getConversation(userId1, userId2, page = 1, limit = 50) {
  try {
    const skip = (page - 1) * limit;

    await Message.updateMany({ senderId: userId2, receiverId: userId1, read: false }, { $set: { read: true, readAt: new Date() } });

    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'firstName lastName')
      .populate('receiverId', 'firstName lastName');

    return messages.reverse();
  } catch (error) {
    console.error('Error in getConversation service:', error);
    throw error;
  }
}

async function getRecentConversations(userId) {
  try {
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('senderId', 'firstName lastName')
      .populate('receiverId', 'firstName lastName');

    const conversations = {};

    messages.forEach((msg) => {
      const otherId = msg.senderId._id.toString() === userId.toString() ? msg.receiverId._id.toString() : msg.senderId._id.toString();

      if (!conversations[otherId]) {
        conversations[otherId] = {
          user: msg.senderId._id.toString() === userId.toString() ? msg.receiverId : msg.senderId,
          lastMessage: msg,
          unreadCount: !msg.read && msg.receiverId._id.toString() === userId.toString() ? 1 : 0,
        };
      } else if (!msg.read && msg.receiverId._id.toString() === userId.toString()) {
        conversations[otherId].unreadCount += 1;
      }
    });

    return Object.values(conversations);
  } catch (error) {
    console.error('Error in getRecentConversations service:', error);
    throw error;
  }
}

async function markAsRead(messageId, userId) {
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      const error = new Error('Message non trouvé');
      error.statusCode = 404;
      throw error;
    }

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

async function getUnreadCount(userId) {
  try {
    return await Message.countDocuments({
      receiverId: userId,
      read: false,
    });
  } catch (error) {
    console.error('Error in getUnreadCount service:', error);
    throw error;
  }
}

module.exports = {
  sendMessage,
  sendDirectMessage,
  getOrderMessages,
  getConversation,
  getRecentConversations,
  markAsRead,
  getUnreadCount,
  normalizeAttachments,
};
