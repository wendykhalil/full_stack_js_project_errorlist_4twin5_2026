const fs = require('fs/promises');
const path = require('path');

const DEFAULT_PROVIDER = process.env.TRANSLATION_PROVIDER || 'auto';
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://127.0.0.1:5001';
const LIBRETRANSLATE_API_KEY = process.env.LIBRETRANSLATE_API_KEY || '';
const GOOGLE_TRANSLATE_URL = process.env.GOOGLE_TRANSLATE_URL || 'https://translate.googleapis.com/translate_a/single';
const LOCALES_DIR = path.resolve(__dirname, '../../../../frontend/src/locales');
const BASE_TRANSLATION_FILE = path.join(LOCALES_DIR, 'en', 'translation.json');

const resourceCache = new Map();
const RESOURCE_CACHE_TTL_MS = 1000 * 60 * 30;

function normalizeLanguage(code) {
  const value = String(code || '').trim().toLowerCase();
  if (!value) return 'en';
  if (value.startsWith('fr')) return 'fr';
  if (value.startsWith('ar')) return 'ar';
  return 'en';
}

function normalizeSourceLanguage(code) {
  const value = String(code || '').trim().toLowerCase();
  if (!value || value === 'auto') return 'auto';
  return normalizeLanguage(value);
}

function dedupeTexts(texts = []) {
  return [...new Set((Array.isArray(texts) ? texts : [])
    .map((item) => String(item || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean))];
}

function chunkArray(items, size = 25) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function protectTemplateTokens(text) {
  const tokens = [];
  let protectedText = String(text || '');

  protectedText = protectedText.replace(/{{\s*[^}]+\s*}}/g, (match) => {
    const token = `__BMP_TOKEN_${tokens.length}__`;
    tokens.push({ token, value: match });
    return token;
  });

  protectedText = protectedText.replace(/\b([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)+)\b/g, (match) => {
    const token = `__BMP_NAME_${tokens.length}__`;
    tokens.push({ token, value: match });
    return token;
  });

  protectedText = protectedText.replace(/\b([A-Z]{2,}(?:[\s-][A-Z]{2,})*)\b/g, (match) => {
    const token = `__BMP_WORD_${tokens.length}__`;
    tokens.push({ token, value: match });
    return token;
  });

  return { protectedText, tokens };
}

function restoreTemplateTokens(text, tokens = []) {
  return tokens.reduce((value, item) => value.replaceAll(item.token, item.value), String(text || ''));
}

async function translateWithLibreTranslate({ texts, targetLang, sourceLang = 'auto' }) {
  const results = [];

  for (const text of texts) {
    const { protectedText, tokens } = protectTemplateTokens(text);
    const payload = {
      q: protectedText,
      source: sourceLang || 'auto',
      target: targetLang,
      format: 'text',
    };

    if (LIBRETRANSLATE_API_KEY) payload.api_key = LIBRETRANSLATE_API_KEY;

    const response = await fetch(`${LIBRETRANSLATE_URL.replace(/\/$/, '')}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`LibreTranslate failed (${response.status}) ${body}`.trim());
    }

    const data = await response.json();
    results.push({
      original: text,
      translated: restoreTemplateTokens(data?.translatedText || text, tokens),
    });
  }

  return results;
}

async function translateWithGoogle({ texts, targetLang, sourceLang = 'auto' }) {
  const results = [];

  for (const text of texts) {
    const { protectedText, tokens } = protectTemplateTokens(text);
    const params = new URLSearchParams({
      client: 'gtx',
      sl: sourceLang || 'auto',
      tl: targetLang,
      dt: 't',
      q: protectedText,
    });

    const response = await fetch(`${GOOGLE_TRANSLATE_URL}?${params.toString()}`);
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Google translate failed (${response.status}) ${body}`.trim());
    }

    const data = await response.json();
    const translatedText = Array.isArray(data?.[0])
      ? data[0].map((part) => Array.isArray(part) ? part[0] : '').join('')
      : text;

    results.push({
      original: text,
      translated: restoreTemplateTokens(translatedText || text, tokens),
    });
  }

  return results;
}

async function translateChunk({ texts, targetLang, sourceLang = 'auto' }) {
  const provider = String(DEFAULT_PROVIDER || 'auto').toLowerCase();

  if (provider === 'libretranslate') {
    return translateWithLibreTranslate({ texts, targetLang, sourceLang });
  }

  if (provider === 'google') {
    return translateWithGoogle({ texts, targetLang, sourceLang });
  }

  try {
    return await translateWithLibreTranslate({ texts, targetLang, sourceLang });
  } catch (error) {
    return translateWithGoogle({ texts, targetLang, sourceLang });
  }
}

async function translateBatch({ texts, targetLang, sourceLang = 'auto' }) {
  const normalizedTarget = normalizeLanguage(targetLang);
  const normalizedSource = normalizeSourceLanguage(sourceLang);
  const uniqueTexts = dedupeTexts(texts).slice(0, 1000);

  if (!uniqueTexts.length) return [];
  if (normalizedSource !== 'auto' && normalizedSource === normalizedTarget) {
    return uniqueTexts.map((text) => ({ original: text, translated: text }));
  }

  const chunks = chunkArray(uniqueTexts, 25);
  const results = [];

  try {
    for (const chunk of chunks) {
      results.push(...await translateChunk({ texts: chunk, targetLang: normalizedTarget, sourceLang: normalizedSource }));
    }
    return results;
  } catch (error) {
    const [baseResource, localResource] = await Promise.all([
      readBaseTranslations().catch(() => null),
      readLocalResource(normalizedTarget),
    ]);

    if (!baseResource || !localResource) throw error;

    const exactMap = createExactValueMap(baseResource, localResource);
    return uniqueTexts.map((text) => ({ original: text, translated: exactMap.get(text) || text }));
  }
}


async function readLocalResource(language) {
  const normalizedLanguage = normalizeLanguage(language);
  const filePath = path.join(LOCALES_DIR, normalizedLanguage, 'translation.json');
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

async function readBaseTranslations() {
  const raw = await fs.readFile(BASE_TRANSLATION_FILE, 'utf8');
  return JSON.parse(raw);
}

function flattenTranslationObject(node, prefix = '', acc = []) {
  if (typeof node === 'string') {
    acc.push({ path: prefix, value: node });
    return acc;
  }

  if (Array.isArray(node)) {
    node.forEach((item, index) => flattenTranslationObject(item, `${prefix}[${index}]`, acc));
    return acc;
  }

  if (node && typeof node === 'object') {
    Object.entries(node).forEach(([key, value]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      flattenTranslationObject(value, nextPrefix, acc);
    });
  }

  return acc;
}

function setDeepValue(target, pathExpression, value) {
  const segments = pathExpression.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current = target;

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1;
    const nextSegment = segments[index + 1];
    const nextIsIndex = /^\d+$/.test(nextSegment || '');

    if (isLast) {
      current[segment] = value;
      return;
    }

    if (!(segment in current)) {
      current[segment] = nextIsIndex ? [] : {};
    }

    current = current[segment];
  });
}

function createExactValueMap(baseNode, translatedNode, map = new Map()) {
  if (typeof baseNode === 'string' && typeof translatedNode === 'string') {
    map.set(baseNode, translatedNode);
    return map;
  }

  if (Array.isArray(baseNode) && Array.isArray(translatedNode)) {
    baseNode.forEach((item, index) => createExactValueMap(item, translatedNode[index], map));
    return map;
  }

  if (baseNode && translatedNode && typeof baseNode === 'object' && typeof translatedNode === 'object') {
    Object.keys(baseNode).forEach((key) => createExactValueMap(baseNode[key], translatedNode[key], map));
  }

  return map;
}

function buildTranslationObject(entries, translationsMap) {
  const result = {};
  entries.forEach(({ path: keyPath, value }) => {
    setDeepValue(result, keyPath, translationsMap.get(value) || value);
  });
  return result;
}

async function getTranslationResource(language) {
  const normalizedLanguage = normalizeLanguage(language);
  if (normalizedLanguage === 'en') {
    return readBaseTranslations();
  }

  const bundledResource = await readLocalResource(normalizedLanguage);
  if (bundledResource) {
    resourceCache.set(normalizedLanguage, {
      value: bundledResource,
      expiresAt: Date.now() + RESOURCE_CACHE_TTL_MS,
    });
    return bundledResource;
  }

  const cached = resourceCache.get(normalizedLanguage);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const baseTranslations = await readBaseTranslations();
  const flattened = flattenTranslationObject(baseTranslations);
  const values = flattened.map((item) => item.value);
  let resource;

  try {
    const translatedEntries = await translateBatch({ texts: values, targetLang: normalizedLanguage, sourceLang: 'en' });
    const translatedMap = new Map(translatedEntries.map((item) => [item.original, item.translated]));
    resource = buildTranslationObject(flattened, translatedMap);
  } catch (error) {
    resource = await readLocalResource(normalizedLanguage);
    if (!resource) throw error;
  }

  resourceCache.set(normalizedLanguage, {
    value: resource,
    expiresAt: Date.now() + RESOURCE_CACHE_TTL_MS,
  });

  return resource;
}

module.exports = { translateBatch, normalizeLanguage, getTranslationResource };
