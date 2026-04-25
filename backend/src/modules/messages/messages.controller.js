const messagesService = require('./messages.service');
const apiResponse = require('../../utils/apiResponse');

function getUserId(req) {
  return req.user?._id || req.user?.id || req.user?.sub || req.user?.userId;
}

function parseAttachmentsField(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_err) {
      return [];
    }
  }
  return [];
}

async function sendMessage(req, res) {
  try {
    const messageData = {
      ...req.body,
      senderId: getUserId(req),
    };

    const message = await messagesService.sendMessage(messageData);
    return apiResponse(res, 'Message envoyé', message, 201);
  } catch (error) {
    console.error('Error in sendMessage controller:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Erreur lors de l'envoi du message",
    });
  }
}

async function sendDirectMessage(req, res) {
  try {
    const { receiverId, content } = req.body;
    const files = Array.isArray(req.files) ? req.files : [];
    const bodyAttachments = parseAttachmentsField(req.body?.attachments);

    if (!receiverId || (!String(content || '').trim() && files.length === 0 && bodyAttachments.length === 0)) {
      return res.status(400).json({ message: 'Destinataire et contenu ou pièce jointe requis' });
    }

    const fileAttachments = files.map((file) => ({
      url: `/uploads/messages/${file.filename}`,
      filename: file.originalname || file.filename,
      storedFilename: file.filename,
      type: file.mimetype || 'application/octet-stream',
      size: file.size || 0,
    }));

    const message = await messagesService.sendDirectMessage({
      senderId: getUserId(req),
      receiverId,
      content: String(content || '').trim(),
      attachments: [...bodyAttachments, ...fileAttachments],
    });

    return apiResponse(res, 'Message envoyé', message, 201);
  } catch (error) {
    console.error('Error in sendDirectMessage controller:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Erreur lors de l'envoi du message",
    });
  }
}

async function getOrderMessages(req, res) {
  try {
    const { orderId } = req.params;
    const messages = await messagesService.getOrderMessages(orderId, getUserId(req));
    return apiResponse(res, 'Messages récupérés', messages);
  } catch (error) {
    console.error('Error in getOrderMessages controller:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors du chargement des messages',
    });
  }
}

async function getConversation(req, res) {
  try {
    const { userId } = req.params;
    const { page, limit } = req.query;

    const messages = await messagesService.getConversation(getUserId(req), userId, Number.parseInt(page, 10) || 1, Number.parseInt(limit, 10) || 50);

    return apiResponse(res, 'Conversation récupérée', messages);
  } catch (error) {
    console.error('Error in getConversation controller:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors du chargement de la conversation',
    });
  }
}

async function getRecentConversations(req, res) {
  try {
    const conversations = await messagesService.getRecentConversations(getUserId(req));
    return apiResponse(res, 'Conversations récentes', conversations);
  } catch (error) {
    console.error('Error in getRecentConversations controller:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors du chargement des conversations',
    });
  }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const message = await messagesService.markAsRead(id, getUserId(req));
    return apiResponse(res, 'Message marqué comme lu', message);
  } catch (error) {
    console.error('Error in markAsRead controller:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors du marquage du message',
    });
  }
}

async function getUnreadCount(req, res) {
  try {
    const count = await messagesService.getUnreadCount(getUserId(req));
    return apiResponse(res, 'Messages non lus', { count });
  } catch (error) {
    console.error('Error in getUnreadCount controller:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors du comptage des messages',
    });
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
};
