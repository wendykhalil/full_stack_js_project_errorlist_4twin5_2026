const { translateBatch, normalizeLanguage, getTranslationResource } = require('./translation.service');

async function translateText(req, res, next) {
  try {
    const texts = Array.isArray(req.body?.texts) ? req.body.texts : [];
    const targetLang = normalizeLanguage(req.body?.targetLang);
    const sourceLang = req.body?.sourceLang || 'auto';
    const items = await translateBatch({ texts, targetLang, sourceLang });
    res.json({ ok: true, provider: process.env.TRANSLATION_PROVIDER || 'auto', targetLang, items });
  } catch (error) {
    next(error);
  }
}

async function getResources(req, res, next) {
  try {
    const language = normalizeLanguage(req.query?.lng || req.query?.lang || 'en');
    const resource = await getTranslationResource(language);
    res.json(resource);
  } catch (error) {
    next(error);
  }
}

module.exports = { translateText, getResources };
