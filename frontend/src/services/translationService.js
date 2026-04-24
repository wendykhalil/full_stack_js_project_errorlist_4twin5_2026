/**
 * DOM-based translation service.
 * Uses Google Translate unofficial endpoint — no API key, no quota limits.
 * Caches everything in localStorage so API is only called once per string.
 */

const CACHE_KEY = (lang) => `bmp_trans_v4_${lang}`;

// Tags to never translate
const SKIP_TAGS = new Set([
  'SCRIPT','STYLE','NOSCRIPT','CODE','PRE','KBD','SAMP',
  'INPUT','TEXTAREA','SELECT','OPTION','SVG','MATH',
]);

// ── Cache ─────────────────────────────────────────────────────────────────────
const mem = { en: null, ar: null };

function ensureCache(lang) {
  if (mem[lang] !== null) return;
  try {
    const raw = localStorage.getItem(CACHE_KEY(lang));
    mem[lang] = raw ? JSON.parse(raw) : {};
  } catch { mem[lang] = {}; }
}

function getCached(lang, key) {
  ensureCache(lang);
  return mem[lang][key] ?? null;
}

function setCache(lang, key, val) {
  ensureCache(lang);
  mem[lang][key] = val;
  try {
    localStorage.setItem(CACHE_KEY(lang), JSON.stringify(mem[lang]));
  } catch { /* storage full */ }
}

export function hasCachedTranslations(lang) {
  if (lang === 'fr') return true;
  ensureCache(lang);
  return Object.keys(mem[lang]).length > 5;
}

// ── Google Translate (unofficial, no key needed) ──────────────────────────────
const LANG_MAP = { en: 'en', ar: 'ar' };

async function googleTranslate(text, targetLang) {
  const tl = LANG_MAP[targetLang] || targetLang;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return text;
    const data = await res.json();
    // Response format: [[[translated, original, ...], ...], ...]
    const translated = data?.[0]?.map(chunk => chunk?.[0] || '').join('') || text;
    return translated || text;
  } catch {
    return text;
  }
}

// Translate a list of unique strings, using cache first
async function translateStrings(strings, lang) {
  const results = {};
  const toFetch = [];

  for (const s of strings) {
    const c = getCached(lang, s);
    if (c !== null) results[s] = c;
    else toFetch.push(s);
  }

  // Fetch uncached — Google handles long text well so batch size can be bigger
  const BATCH = 10;
  for (let i = 0; i < toFetch.length; i += BATCH) {
    const batch = toFetch.slice(i, i + BATCH);
    const translated = await Promise.all(batch.map(s => googleTranslate(s, lang)));
    batch.forEach((s, idx) => {
      results[s] = translated[idx];
      setCache(lang, s, translated[idx]);
    });
    // Small delay to avoid rate limiting
    if (i + BATCH < toFetch.length) {
      await new Promise(r => setTimeout(r, 80));
    }
  }

  return results;
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function shouldSkip(node) {
  let el = node.parentElement;
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.hasAttribute('data-no-translate')) return true;
    el = el.parentElement;
  }
  return false;
}

function isTranslatable(text) {
  const t = text.trim();
  if (!t || t.length < 2) return false;
  if (/^[\d\s.,;:!?%€$£+\-*/=<>()[\]{}|@#^~`'"\\/_]+$/.test(t)) return false;
  if (/^https?:\/\//.test(t)) return false;
  if (/^[A-Z_]{2,12}$/.test(t)) return false; // status codes
  return true;
}

function protect(text) {
  const tokens = [];
  const out = text.replace(/(\{\{[^}]+\}\}|#[\w-]+|\+\d[\d\s]{5,}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g, m => {
    tokens.push(m);
    return `⟦${tokens.length - 1}⟧`;
  });
  return { out, tokens };
}

function unprotect(text, tokens) {
  return text.replace(/⟦(\d+)⟧/g, (_, i) => tokens[+i] ?? '');
}

function collectNodes(root) {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (shouldSkip(n)) return NodeFilter.FILTER_REJECT;
      if (!isTranslatable(n.textContent)) return NodeFilter.FILTER_SKIP;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  return nodes;
}

// ── State ─────────────────────────────────────────────────────────────────────
const originals = new WeakMap();
const nodeKeys  = new WeakMap();
let observer = null;
let busy = false;

// ── Exports ───────────────────────────────────────────────────────────────────

export async function translateDOM(lang, onProgress) {
  if (busy) return;
  busy = true;

  try {
    const nodes = collectNodes(document.body);
    if (!nodes.length) { onProgress?.(100); return; }

    // Save originals & build key map
    const uniqueKeys = new Set();
    nodes.forEach(n => {
      const raw = n.textContent.trim();
      if (!originals.has(n)) originals.set(n, raw);
      const { out, tokens } = protect(raw);
      nodeKeys.set(n, { key: out, tokens });
      if (isTranslatable(out)) uniqueKeys.add(out);
    });

    const allKeys = [...uniqueKeys];
    const CHUNK = 60;
    let done = 0;

    for (let i = 0; i < allKeys.length; i += CHUNK) {
      await translateStrings(allKeys.slice(i, i + CHUNK), lang);
      done += Math.min(CHUNK, allKeys.length - i);
      onProgress?.(Math.min(99, Math.round((done / allKeys.length) * 100)));
    }

    applyToNodes(nodes, lang);
    onProgress?.(100);
  } finally {
    busy = false;
  }
}

function applyToNodes(nodes, lang) {
  nodes.forEach(n => {
    const meta = nodeKeys.get(n);
    if (!meta) return;
    const t = getCached(lang, meta.key);
    if (t && t !== meta.key) {
      n.textContent = unprotect(t, meta.tokens);
    }
  });
}

export function restoreDOM() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (originals.has(n)) n.textContent = originals.get(n);
  }
}

export function startObserver(lang) {
  stopObserver();
  if (lang === 'fr') return;

  observer = new MutationObserver(mutations => {
    if (busy) return;
    const newNodes = [];
    mutations.forEach(m => {
      m.addedNodes.forEach(added => {
        if (added.nodeType === Node.TEXT_NODE) {
          if (isTranslatable(added.textContent) && !shouldSkip(added)) newNodes.push(added);
        } else if (added.nodeType === Node.ELEMENT_NODE) {
          collectNodes(added).forEach(n => newNodes.push(n));
        }
      });
    });
    if (!newNodes.length) return;

    newNodes.forEach(n => {
      const raw = n.textContent.trim();
      if (!originals.has(n)) originals.set(n, raw);
      const { out, tokens } = protect(raw);
      nodeKeys.set(n, { key: out, tokens });
    });

    const keys = [...new Set(newNodes.map(n => nodeKeys.get(n)?.key).filter(k => k && isTranslatable(k)))];
    translateStrings(keys, lang).then(() => applyToNodes(newNodes, lang));
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

export function stopObserver() {
  observer?.disconnect();
  observer = null;
}

export function clearTranslationCache() {
  ['en', 'ar'].forEach(lang => {
    localStorage.removeItem(CACHE_KEY(lang));
    mem[lang] = null;
  });
}
