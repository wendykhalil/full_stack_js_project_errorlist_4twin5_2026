const Project = require('../../models/Project');
const aiService = require('./ai.service');

function getUserId(req) {
  return req.user?._id || req.user?.id || req.user?.sub || req.user?.userId;
}

async function suggestProject(req, res, next) {
  try {
    const data = await aiService.suggestProject(req.body || {});
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

async function suggestProduct(req, res, next) {
  try {
    const data = await aiService.suggestProduct(req.body || {});
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

async function suggestQuoteFromProject(req, res, next) {
  try {
    const artisanId = getUserId(req);
    const { projectId } = req.body || {};
    if (!projectId) return res.status(400).json({ message: 'projectId est requis' });

    const project = await Project.findById(projectId).lean();
    if (!project) return res.status(404).json({ message: 'Projet introuvable' });
    if (String(project.artisanId) !== String(artisanId)) return res.status(403).json({ message: 'Accès interdit' });

    const data = await aiService.suggestQuoteFromProject(project);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

async function smartSearch(req, res, next) {
  try {
    const { q = '', scope = 'all', limit = 8 } = req.query;
    const data = await aiService.smartSearch({ q, scope, limit: Number(limit) || 8 });
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  suggestProject,
  suggestProduct,
  suggestQuoteFromProject,
  smartSearch,
};
