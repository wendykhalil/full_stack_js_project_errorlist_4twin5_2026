const Product = require('../../models/Product');
const Project = require('../../models/Project');
const Category = require('../../models/Category');
const ArtisanProfile = require('../../models/ArtisanProfile');
const User = require('../../models/User');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function uniqStrings(items = [], max = 8) {
  return [...new Set((Array.isArray(items) ? items : []).map((item) => String(item || '').trim()).filter(Boolean))].slice(0, max);
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || '').match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function callOllamaJson({ system, prompt }) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      system,
      prompt,
      format: 'json',
      stream: false,
      options: {
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed (${response.status})`);
  }

  const data = await response.json();
  const parsed = safeJsonParse(data?.response);
  if (!parsed) throw new Error('Invalid Ollama JSON response');
  return parsed;
}

function heuristicProjectSuggestion(payload = {}) {
  const brief = [payload.title, payload.category, payload.description, payload.brief].filter(Boolean).join(' ').toLowerCase();
  const categories = [
    { test: /(cuisine|kitchen)/, label: 'Cuisine' },
    { test: /(salle de bain|bathroom|douche)/, label: 'Salle de bain' },
    { test: /(peinture|paint)/, label: 'Peinture' },
    { test: /(électricité|electric|eclairage|lighting)/, label: 'Électricité' },
    { test: /(plomberie|plumb)/, label: 'Plomberie' },
    { test: /(carrelage|tile)/, label: 'Revêtement / carrelage' },
    { test: /(façade|facade|extérieur|exterieur)/, label: 'Façade extérieure' },
  ];
  const category = payload.category || categories.find((entry) => entry.test.test(brief))?.label || 'Rénovation générale';
  const materials = uniqStrings([
    /(cuisine|kitchen)/.test(brief) ? 'meubles de cuisine' : '',
    /(cuisine|kitchen)/.test(brief) ? 'plan de travail' : '',
    /(salle de bain|bathroom|douche)/.test(brief) ? 'carrelage antidérapant' : '',
    /(salle de bain|bathroom|douche)/.test(brief) ? 'robinetterie' : '',
    /(peinture|paint)/.test(brief) ? 'peinture lessivable' : '',
    /(électricité|electric|lighting)/.test(brief) ? 'câblage' : '',
    /(électricité|electric|lighting)/.test(brief) ? 'luminaires LED' : '',
    /(plomberie|plumb)/.test(brief) ? 'tuyauterie' : '',
    /(carrelage|tile)/.test(brief) ? 'carrelage grès cérame' : '',
    'main d’œuvre spécialisée',
  ]);

  const budgetTND = payload.budgetTND || (
    /(cuisine|kitchen)/.test(brief) ? 12000 :
    /(salle de bain|bathroom|douche)/.test(brief) ? 8500 :
    /(façade|facade)/.test(brief) ? 15000 :
    9500
  );

  const surfaceM2 = payload.surfaceM2 || (
    /(cuisine|kitchen)/.test(brief) ? 18 :
    /(salle de bain|bathroom|douche)/.test(brief) ? 10 :
    35
  );

  return {
    title: payload.title || `Projet ${category.toLowerCase()}`,
    category,
    description: payload.description || `Projet de ${category.toLowerCase()} avec préparation du chantier, fourniture des matériaux principaux, exécution soignée et finitions propres. Une attention particulière sera portée à la qualité, au respect des délais et à la coordination des intervenants.`,
    materials,
    budgetTND,
    surfaceM2,
    city: payload.city || '',
    keywords: uniqStrings([category, ...materials]),
  };
}

async function suggestProject(payload = {}) {
  const fallback = heuristicProjectSuggestion(payload);
  try {
    const result = await callOllamaJson({
      system: 'You generate concise JSON only for a Tunisian construction marketplace. Return only valid JSON. No markdown.',
      prompt: `Suggest a construction project draft in Tunisia based on this input: ${JSON.stringify(payload)}\nReturn JSON with keys: title, category, description, materials (array of max 8 strings), budgetTND (number), surfaceM2 (number), city (string), keywords (array of max 6 strings). Use French.`,
    });
    return {
      ...fallback,
      ...result,
      materials: uniqStrings(result.materials || fallback.materials),
      keywords: uniqStrings(result.keywords || fallback.keywords, 6),
      budgetTND: clampNumber(result.budgetTND, 0, 10000000, fallback.budgetTND),
      surfaceM2: clampNumber(result.surfaceM2, 0, 100000, fallback.surfaceM2),
    };
  } catch {
    return fallback;
  }
}

function heuristicProductSuggestion(payload = {}) {
  const text = [payload.name, payload.categoryName, payload.description].filter(Boolean).join(' ').toLowerCase();
  const categoryName = payload.categoryName || (
    /(ciment|cement|mortier)/.test(text) ? 'Ciment et mortier' :
    /(lampe|led|lumière|luminaire)/.test(text) ? 'Éclairage' :
    /(peinture|paint)/.test(text) ? 'Peinture' :
    /(carrelage|tile)/.test(text) ? 'Carrelage' :
    'Matériaux divers'
  );

  const priceSuggestion =
    /(ciment|cement)/.test(text) ? 18.5 :
    /(lampe|led)/.test(text) ? 24.9 :
    /(peinture|paint)/.test(text) ? 65 :
    /(carrelage|tile)/.test(text) ? 42 : 29;

  const stockSuggestion =
    /(ciment|cement|carrelage|tile)/.test(text) ? 120 :
    /(lampe|led)/.test(text) ? 60 : 40;

  return {
    categoryName,
    description: payload.description || `${payload.name || 'Ce produit'} est adapté aux besoins des chantiers professionnels et particuliers. Il offre une bonne durabilité, une mise en œuvre simple et un excellent rapport qualité/prix pour le marché tunisien.`,
    priceSuggestion,
    stockSuggestion,
    sellingPoints: uniqStrings(['bonne durabilité', 'adapté au chantier', 'livraison rapide', 'rapport qualité/prix']),
  };
}

async function suggestProduct(payload = {}) {
  const fallback = heuristicProductSuggestion(payload);
  try {
    const result = await callOllamaJson({
      system: 'You generate concise JSON only for a Tunisian B2B/B2C construction marketplace. Return valid JSON only.',
      prompt: `Product input: ${JSON.stringify(payload)}\nReturn JSON with keys: categoryName, description, priceSuggestion, stockSuggestion, sellingPoints (array of max 5 strings). Use French.`,
    });
    return {
      ...fallback,
      ...result,
      priceSuggestion: clampNumber(result.priceSuggestion, 0, 1000000, fallback.priceSuggestion),
      stockSuggestion: clampNumber(result.stockSuggestion, 0, 1000000, fallback.stockSuggestion),
      sellingPoints: uniqStrings(result.sellingPoints || fallback.sellingPoints, 5),
    };
  } catch {
    return fallback;
  }
}

function heuristicQuoteSuggestion(project) {
  const materials = uniqStrings(project?.materials || []);
  const category = String(project?.category || '').toLowerCase();
  const baseLines = [
    { description: 'Étude technique et préparation du chantier', quantity: 1, unitPrice: 450 },
    { description: 'Main d’œuvre spécialisée', quantity: Math.max(1, Math.round(Number(project?.surfaceM2 || 20) / 10)), unitPrice: 780 },
  ];

  if (materials.length) {
    baseLines.push({ description: `Fourniture matériaux: ${materials.slice(0, 3).join(', ')}`, quantity: 1, unitPrice: Math.max(350, Number(project?.budgetTND || 3000) * 0.35) });
  }

  if (/cuisine/.test(category)) baseLines.push({ description: 'Pose éléments de cuisine et finitions', quantity: 1, unitPrice: 1800 });
  if (/salle de bain/.test(category)) baseLines.push({ description: 'Étanchéité et pose sanitaires', quantity: 1, unitPrice: 1600 });
  if (/peinture/.test(category)) baseLines.push({ description: 'Préparation supports et peinture', quantity: Math.max(1, Math.round(Number(project?.surfaceM2 || 20) / 12)), unitPrice: 320 });
  if (/plomberie/.test(category)) baseLines.push({ description: 'Réseau plomberie et raccordements', quantity: 1, unitPrice: 1200 });
  if (/électricité/.test(category)) baseLines.push({ description: 'Câblage, appareillage et tests', quantity: 1, unitPrice: 1350 });

  const lines = baseLines.map((line) => ({
    ...line,
    lineTotal: Number((Number(line.quantity) * Number(line.unitPrice)).toFixed(3)),
  }));

  return {
    lines,
    taxRate: 0.19,
    discount: 0,
    summary: `Devis suggéré pour ${project?.title || 'le projet'} avec postes principaux, matériaux et main d’œuvre.`
  };
}

async function suggestQuoteFromProject(project) {
  const fallback = heuristicQuoteSuggestion(project);
  try {
    const result = await callOllamaJson({
      system: 'You create quote draft JSON only for construction projects in Tunisia. Return valid JSON only.',
      prompt: `Project: ${JSON.stringify(project)}\nReturn JSON with keys: summary, taxRate, discount, lines. lines must be an array of 3 to 6 items, each item with description, quantity, unitPrice. Use French and realistic Tunisian dinar pricing.`,
    });
    const lines = (Array.isArray(result.lines) ? result.lines : fallback.lines).map((line) => {
      const quantity = clampNumber(line.quantity, 1, 100000, 1);
      const unitPrice = clampNumber(line.unitPrice, 0, 10000000, 0);
      return {
        description: String(line.description || '').trim() || 'Ligne de prestation',
        quantity,
        unitPrice,
        lineTotal: Number((quantity * unitPrice).toFixed(3)),
      };
    }).slice(0, 8);

    return {
      summary: result.summary || fallback.summary,
      taxRate: clampNumber(result.taxRate, 0, 1, 0.19),
      discount: clampNumber(result.discount, 0, 10000000, 0),
      lines: lines.length ? lines : fallback.lines,
    };
  } catch {
    return fallback;
  }
}

function tokenizeQuery(q) {
  return uniqStrings(String(q || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 1), 10);
}

function scoreTextMatch(query, haystacks = []) {
  const tokens = tokenizeQuery(query);
  const combined = haystacks.filter(Boolean).join(' ').toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (combined.includes(token)) score += token.length > 4 ? 4 : 2;
  }
  if (combined.includes(String(query || '').toLowerCase().trim())) score += 6;
  return score;
}

async function smartSearch({ scope = 'all', q = '', limit = 8 }) {
  const query = String(q || '').trim();
  if (!query) {
    return { products: [], projects: [], artisans: [], suggestions: [] };
  }

  const mongoRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const searchLimit = Math.min(30, Math.max(4, Number(limit) || 8));

  const shouldSearchProducts = scope === 'all' || scope === 'products' || scope === 'marketplace';
  const shouldSearchProjects = scope === 'all' || scope === 'projects';
  const shouldSearchArtisans = scope === 'all' || scope === 'artisans';

  const [products, projects, artisanProfiles] = await Promise.all([
    shouldSearchProducts
      ? Product.find({ $or: [{ name: mongoRegex }, { description: mongoRegex }] }).populate('categoryId', 'name').sort({ createdAt: -1 }).limit(searchLimit).lean()
      : [],
    shouldSearchProjects
      ? Project.find({ $or: [{ title: mongoRegex }, { description: mongoRegex }, { category: mongoRegex }, { materials: mongoRegex }, { 'location.city': mongoRegex }] }).sort({ createdAt: -1 }).limit(searchLimit).lean()
      : [],
    shouldSearchArtisans
      ? ArtisanProfile.find({ $or: [{ trade: mongoRegex }, { region: mongoRegex }, { description: mongoRegex }, { 'address.city': mongoRegex }] }).populate('userId', 'firstName lastName').limit(searchLimit).lean()
      : [],
  ]);

  const scoredProducts = products
    .map((item) => ({
      _id: item._id,
      name: item.name,
      description: item.description,
      category: item.categoryId?.name || '',
      price: item.price,
      imageUrl: item.imageUrls?.[0] || '',
      score: scoreTextMatch(query, [item.name, item.description, item.categoryId?.name]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const scoredProjects = projects
    .map((item) => ({
      _id: item._id,
      title: item.title,
      description: item.description,
      category: item.category,
      city: item.location?.city || '',
      budgetTND: item.budgetTND,
      imageUrl: item.images?.[0]?.url || item.images?.[0] || '',
      score: scoreTextMatch(query, [item.title, item.description, item.category, item.location?.city, ...(item.materials || [])]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const scoredArtisans = artisanProfiles
    .map((item) => ({
      _id: item._id,
      userId: item.userId?._id,
      name: `${item.userId?.firstName || ''} ${item.userId?.lastName || ''}`.trim(),
      trade: item.trade,
      region: item.region,
      profileImage: item.profileImage,
      score: scoreTextMatch(query, [item.trade, item.region, item.description, item.address?.city, item.userId?.firstName, item.userId?.lastName]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const suggestions = uniqStrings([
    ...scoredProducts.slice(0, 3).map((item) => item.category),
    ...scoredProjects.slice(0, 3).map((item) => item.category),
    ...scoredArtisans.slice(0, 2).map((item) => item.trade),
    ...tokenizeQuery(query),
  ], 6);

  return { products: scoredProducts, projects: scoredProjects, artisans: scoredArtisans, suggestions };
}

module.exports = {
  suggestProject,
  suggestProduct,
  suggestQuoteFromProject,
  smartSearch,
};
