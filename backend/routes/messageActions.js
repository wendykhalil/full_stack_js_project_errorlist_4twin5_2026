const express = require('express');
const router = express.Router();
const Message = require('../src/models/Message');

// PATCH /api/messages/:id - Edit a message
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?.id || req.user?._id;

    // Validation
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du message est requis'
      });
    }

    if (content.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Le message doit contenir au moins 1 caractère'
      });
    }

    // Find message and check ownership
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message introuvable'
      });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez modifier que vos propres messages'
      });
    }

    // Update message in database
    const updatedMessage = await Message.findByIdAndUpdate(
      id,
      { 
        content: content.trim(),
        edited: true,
        editedAt: new Date()
      },
      { new: true }
    ).populate('senderId', 'firstName lastName profileImage')
     .populate('receiverId', 'firstName lastName profileImage');

    console.log(`Message ${id} edited by user ${userId}: "${content.trim()}"`);

    res.json({
      success: true,
      message: 'Message modifié avec succès',
      data: updatedMessage
    });

  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la modification du message'
    });
  }
});

// DELETE /api/messages/:id - Delete a message
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;

    // Find message and check ownership
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message introuvable'
      });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez supprimer que vos propres messages'
      });
    }

    // Delete message from database
    await Message.findByIdAndDelete(id);

    console.log(`Message ${id} deleted by user ${userId}`);

    res.json({
      success: true,
      message: 'Message supprimé avec succès'
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du message'
    });
  }
});

module.exports = router;