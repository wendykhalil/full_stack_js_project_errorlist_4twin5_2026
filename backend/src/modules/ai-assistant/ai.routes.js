const express = require('express');
const controller = require('./ai.controller');
const { authRequired } = require('../../middleware/authMiddleware');
const { requireRoles } = require('../../middleware/roleMiddleware');
const { detectIntents, fetchContext, buildMessages, streamChat } = require('./chat.service');

const router = express.Router();

// ── Existing AI tools ─────────────────────────────────────────────────────────
router.get('/smart-search', controller.smartSearch);
router.post('/suggest/project', authRequired, controller.suggestProject);
router.post('/suggest/product', authRequired, controller.suggestProduct);
router.post('/quote/from-project', authRequired, requireRoles('ARTISAN'), controller.suggestQuoteFromProject);

// ── RAG Chat ──────────────────────────────────────────────────────────────────
router.post('/chat', authRequired, async (req, res) => {
  const { message, history = [] } = req.body || {};

  if (!message?.trim()) {
    return res.status(400).json({ message: 'Message requis' });
  }

  // SSE headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const user = req.user;
    const intents = detectIntents(message);
    const context = await fetchContext(user._id, user.role, intents, message);
    const messages = buildMessages(user, context, message, history);
    await streamChat(messages, res);
  } catch (err) {
    console.error('Chat error:', err.message);
    res.write(`data: ${JSON.stringify({ text: '\n\n❌ Erreur: ' + (err.message.includes('Ollama') ? 'Le modèle IA est hors ligne. Vérifiez qu\'Ollama est démarré.' : err.message) })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

module.exports = router;
