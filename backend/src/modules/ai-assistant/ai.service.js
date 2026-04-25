const Order = require('../../models/Order');
const Project = require('../../models/Project');
const Facture = require('../../models/Facture');
const Devis = require('../../models/Devis');
const Product = require('../../models/Product');
const ArtisanProfile = require('../../models/ArtisanProfile');
const Availability = require('../../models/Availability');
const Subscription = require('../../models/Subscription');
const ServiceRequest = require('../../models/ServiceRequest');
const Review = require('../../models/Review');
const PromoCode = require('../../models/PromoCode');
const { getPlanFeatures } = require('../../config/subscriptionPlans');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';

// ── Intent detection ──────────────────────────────────────────────────────────
function detectIntents(message) {
  const msg = message.toLowerCase();
  const intents = new Set();

  if (/commande|order|livr|expédi|colis|cmd-/.test(msg))           intents.add('orders');
  if (/facture|invoice|impayé|paiement|total|montant/.test(msg))   intents.add('invoices');
  if (/devis|quote|estimation/.test(msg))                          intents.add('quotes');
  if (/projet|chantier|project|chantiers/.test(msg))               intents.add('projects');
  if (/produit|product|matériau|ciment|peinture|carrelage|stock|prix|catalogue|marketplace|acheter|commander|fournisseur|disponible/.test(msg)) intents.add('products');
  if (/abonnement|subscription|plan|basic|pro|expire/.test(msg))   intents.add('subscription');
  if (/artisan|plombier|électricien|maçon|peintre|menuisier|carreleur|disponib/.test(msg)) intents.add('artisans');
  if (/disponib|calendrier|libre|occupé|réservé/.test(msg))        intents.add('availability');
  if (/demande.*service|service.*request|mission|candidature|demandes|demande/.test(msg)) intents.add('serviceRequests');
  if (/avis|note|évaluation|rating|review/.test(msg))              intents.add('reviews');
  if (/promo|code.*promo|réduction|discount/.test(msg))            intents.add('promo');
  if (/prescripteur|prescripteurs|architecte|architectes|utilisateur|utilisateurs|membres|membre/.test(msg)) intents.add('users');

  return intents.size ? [...intents] : ['general'];
}

// ── Product keyword extraction ──────────────────────────────────────────────
const STOP_WORDS = new Set(['les','des','du','de','la','le','un','une','pour','avec','dans','sur','quels','quel','quelle','sont','disponibles','disponible','produits','produit','matériaux','matériau','cherche','trouve','montre','voir','prix','stock']);

function extractProductKeywords(message) {
  const msg = message.toLowerCase();
  return msg.replace(/[^\w\sàâäéèêëîïôùûüç]/gi, '').split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w)).slice(0, 4);
}

function buildProductFilter(keywords) {
  const filter = { isApproved: true };
  if (keywords.length) {
    filter.$or = keywords.flatMap(k => [
      { name: new RegExp(k, 'i') },
      { description: new RegExp(k, 'i') },
    ]);
  }
  return filter;
}

// ── Trade aliases configuration ─────────────────────────────────────────────
const TRADE_ALIASES = {
  'Plombier':      ['plombier','plombiers','plombi'],
  'Électricien':   ['electricien','électricien','electri'],
  'Maçon':         ['macon','maçon','maconier','maconnier','maçonnier','maçonnerie','maconnerie'],
  'Peintre':       ['peintre','peintres','peintur'],
  'Menuisier':     ['menuisier','menuisiers','menuiser'],
  'Carreleur':     ['carreleur','carreleurs','carrele'],
  'Chauffagiste':  ['chauffagiste','chauffage'],
  'Climatisation': ['climatisation','climatiseur','clim'],
  'Jardinier':     ['jardinier','jardiniers','jardin'],
};

const CITIES = ['tunis','ariana','sfax','sousse','monastir','bizerte','nabeul','kairouan','gabès'];

function extractArtisanFilters(message) {
  const msg = message.toLowerCase();
  const msgNorm = msg.normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '').toLowerCase();
  const trade = Object.entries(TRADE_ALIASES).find(([, aliases]) =>
    aliases.some(alias => msgNorm.includes(alias))
  )?.[0];
  const city = CITIES.find(c => msg.includes(c));
  return { trade, city };
}

// ── Service request filter helpers ──────────────────────────────────────────
function getServiceRequestStatusFilter(msg, wantsOpen, wantsDone, wantsCancelled) {
  if (wantsDone) return ['COMPLETED'];
  if (wantsCancelled) return ['CANCELLED'];
  if (wantsOpen) return ['OPEN', 'ASSIGNED'];
  return undefined;
}

function detectServiceRequestFilters(message) {
  const msg = message.toLowerCase();
  const wantsOpen = /pas.*(terminé|fini|complété|fermé)|non.*(terminé|fini)|en cours|ouvert|open|actif|active|encore|progress/.test(msg);
  const wantsDone = /\bterminé|\bcomplété|\bcompleted|\bfermé|\bclosed|\bfini/.test(msg) && !wantsOpen;
  const wantsCancelled = /annulé|cancelled/.test(msg);
  return { wantsOpen, wantsDone, wantsCancelled };
}

// ── User filter helpers ─────────────────────────────────────────────────────
function detectUserRoleFilter(message) {
  const msg = message.toLowerCase();
  if (/prescripteur|prescripteurs|architecte/.test(msg)) return 'PRESCRIPTEUR';
  if (/fournisseur|fournisseurs|supplier/.test(msg)) return 'SUPPLIER';
  if (/artisan|artisans/.test(msg)) return 'ARTISAN';
  return null;
}

// ── Data fetcher ──────────────────────────────────────────────────────────────
async function fetchOrders(ctx, userId, role) {
  const orders = await Order.find(
    role === 'SUPPLIER' ? { supplierId: userId } : { artisanId: userId }
  ).sort({ createdAt: -1 }).limit(5)
    .populate('productId', 'name price').lean();
  ctx.orders = orders.map(o => ({
    ref: o.orderNumber,
    product: o.productId?.name,
    quantity: o.quantity,
    total: o.lineTotal,
    status: o.status,
    date: o.createdAt?.toISOString().slice(0, 10),
  }));
}

async function fetchProjects(ctx, userId, role, intents) {
  if (intents.includes('projects') && role === 'ARTISAN') {
    const projects = await Project.find({ artisanId: userId })
      .sort({ updatedAt: -1 }).limit(5).lean();
    ctx.projects = projects.map(p => ({
      title: p.title,
      status: p.status,
      city: p.location?.city,
      budget: p.budgetTND,
      category: p.category,
      startDate: p.startDate?.toISOString().slice(0, 10),
      endDate: p.endDate?.toISOString().slice(0, 10),
    }));
  }
}

async function fetchInvoices(ctx, userId, role, intents) {
  if (intents.includes('invoices') && role === 'ARTISAN') {
    const invoices = await Facture.find({ artisanId: userId })
      .sort({ createdAt: -1 }).limit(5)
      .populate('projectId', 'title').lean();
    ctx.invoices = invoices.map(f => ({
      project: f.projectId?.title,
      total: f.total,
      status: f.status,
      dueDate: f.dueDate?.toISOString().slice(0, 10),
    }));
    ctx.unpaidTotal = invoices
      .filter(f => f.status !== 'PAID')
      .reduce((s, f) => s + (f.total || 0), 0);
  }
}

async function fetchQuotes(ctx, userId, role, intents) {
  if (intents.includes('quotes') && role === 'ARTISAN') {
    const quotes = await Devis.find({ artisanId: userId })
      .sort({ createdAt: -1 }).limit(5)
      .populate('projectId', 'title').lean();
    ctx.quotes = quotes.map(q => ({
      project: q.projectId?.title,
      total: q.total,
      status: q.status,
    }));
  }
}

async function fetchSubscription(ctx, userId, intents) {
  if (intents.includes('subscription')) {
    const sub = await Subscription.findOne({ userId }).lean();
    ctx.subscription = sub ? {
      plan: sub.plan,
      status: sub.status,
      endDate: sub.endDate?.toISOString().slice(0, 10),
      isOnTrial: sub.isOnTrial,
      features: getPlanFeatures(sub.plan),
    } : { plan: 'FREE', status: 'ACTIVE' };
  }
}

async function fetchProducts(ctx, message) {
  const keywords = extractProductKeywords(message);
  const filter = buildProductFilter(keywords);
  let products = await Product.find(filter).limit(8).populate('categoryId', 'name').lean();
  if (!products.length) {
    products = await Product.find({ isApproved: true }).limit(8).populate('categoryId', 'name').lean();
  }
  ctx.products = products.map(p => ({
    name: p.name,
    price: `${p.price} TND`,
    unit: p.unit,
    stock: p.stock,
    category: p.categoryId?.name || p.category,
    description: p.description?.slice(0, 100),
  }));
}

async function fetchArtisans(ctx, message) {
  const { trade, city } = extractArtisanFilters(message);
  const filter = {};
  if (trade) filter.trade = trade;
  if (city) filter.region = new RegExp(city, 'i');

  const [artisans, totalArtisans] = await Promise.all([
    ArtisanProfile.find(filter).limit(10).populate('userId', 'firstName lastName').lean(),
    ArtisanProfile.countDocuments(filter),
  ]);
  ctx.artisans = artisans.map(a => ({
    name: `${a.userId?.firstName} ${a.userId?.lastName}`,
    trade: a.trade,
    region: a.region,
    phone: a.phone,
  }));
  ctx.artisansTotalCount = totalArtisans;
  ctx.artisansNote = `LISTE COMPLÈTE: ${totalArtisans} artisan(s) au total dans la base. Aucun autre n'existe.`;
}

async function fetchAvailability(ctx, userId, role, intents, message) {
  if (!intents.includes('availability')) return;
  
  const from = new Date();
  const to = new Date(); to.setDate(to.getDate() + 14);

  if (intents.includes('artisans')) {
    const artisanIds = await ArtisanProfile.find({}).limit(5).distinct('userId');
    const avail = await Availability.find({
      artisanId: { $in: artisanIds },
      date: { $gte: from, $lte: to },
      status: 'AVAILABLE',
    }).populate('artisanId', 'firstName lastName').lean();
    ctx.availability = avail.map(a => ({
      artisan: `${a.artisanId?.firstName} ${a.artisanId?.lastName}`,
      date: a.date?.toISOString().slice(0, 10),
      status: a.status,
    }));
  } else if (role === 'ARTISAN') {
    const avail = await Availability.find({
      artisanId: userId,
      date: { $gte: from, $lte: to },
    }).lean();
    ctx.myAvailability = avail.map(a => ({
      date: a.date?.toISOString().slice(0, 10),
      status: a.status,
      note: a.note,
    }));
  }
}

async function fetchServiceRequests(ctx, userId, role, message) {
  const msg = message.toLowerCase();
  const { wantsOpen, wantsDone, wantsCancelled } = detectServiceRequestFilters(message);
  const statusFilter = getServiceRequestStatusFilter(msg, wantsOpen, wantsDone, wantsCancelled);

  if (role === 'PRESCRIPTEUR') {
    const query = { prescripteurId: userId };
    if (statusFilter) query.status = { $in: statusFilter };
    const requests = await ServiceRequest.find(query)
      .sort({ createdAt: -1 }).limit(10)
      .populate('assignedArtisanId', 'firstName lastName').lean();
    ctx.serviceRequests = requests.map(r => ({
      title: r.title, trade: r.trade, city: r.city, status: r.status,
      applicants: r.applications?.length || 0,
      assignedTo: r.assignedArtisanId ? `${r.assignedArtisanId.firstName} ${r.assignedArtisanId.lastName}` : null,
      deadline: r.deadline?.toISOString().slice(0, 10), budget: r.budgetTND,
    }));
  } else if (role === 'ARTISAN') {
    const applied = await ServiceRequest.find({ 'applications.artisanId': userId })
      .sort({ createdAt: -1 }).limit(10)
      .populate('prescripteurId', 'firstName lastName').lean();
    ctx.myApplications = applied
      .filter(r => {
        if (wantsOpen) return ['OPEN', 'ASSIGNED'].includes(r.status);
        if (wantsDone) return r.status === 'COMPLETED';
        return true;
      })
      .map(r => {
        const myApp = r.applications.find(a => String(a.artisanId) === String(userId));
        return {
          title: r.title, trade: r.trade, requestStatus: r.status,
          applicationStatus: myApp?.status,
          prescripteur: `${r.prescripteurId?.firstName} ${r.prescripteurId?.lastName}`,
          city: r.city,
        };
      });
  }
}

async function fetchReviews(ctx, userId) {
  const reviews = await Review.find({ targetId: userId })
    .sort({ createdAt: -1 }).limit(5)
    .populate('authorId', 'firstName lastName').lean();
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0;
  ctx.reviews = { average: avg, count: reviews.length, latest: reviews.slice(0, 3).map(r => ({ author: `${r.authorId?.firstName} ${r.authorId?.lastName}`, rating: r.rating, comment: r.comment })) };
}

async function fetchPromo(ctx, message) {
  const promoMatch = message.match(/[A-Z0-9_-]{3,30}/);
  if (promoMatch) {
    const promo = await PromoCode.findOne({ code: promoMatch[0], isActive: true }).lean();
    ctx.promoCode = promo ? {
      code: promo.code,
      discount: promo.discountPercent,
      valid: !promo.expiresAt || new Date() < new Date(promo.expiresAt),
      usesLeft: promo.maxUses ? promo.maxUses - promo.usedCount : 'illimité',
    } : { found: false };
  }
}

async function fetchUsers(ctx, message) {
  const User = require('../../models/User');
  const roleFilter = detectUserRoleFilter(message);
  const query = { status: { $ne: 'BLOCKED' } };
  if (roleFilter) query.role = roleFilter;
  else query.role = { $in: ['ARTISAN', 'PRESCRIPTEUR', 'SUPPLIER'] };

  const [users, total] = await Promise.all([
    User.find(query).select('firstName lastName role email phone').limit(15).lean(),
    User.countDocuments(query),
  ]);
  ctx.platformUsers = users.map(u => ({
    name: `${u.firstName} ${u.lastName}`,
    role: u.role,
    phone: u.phone || '—',
  }));
  ctx.platformUsersTotal = total;
  ctx.platformUsersNote = `LISTE COMPLÈTE: ${total} utilisateur(s) avec ce filtre. Aucun autre n'existe.`;
}

// ── Main fetchContext function (simplified) ─────────────────────────────────
async function fetchContext(userId, role, intents, message) {
  const ctx = {};

  try {
    await fetchOrders(ctx, userId, role);
    await fetchProjects(ctx, userId, role, intents);
    await fetchInvoices(ctx, userId, role, intents);
    await fetchQuotes(ctx, userId, role, intents);
    await fetchSubscription(ctx, userId, intents);

    if (intents.includes('products')) await fetchProducts(ctx, message);
    if (intents.includes('artisans')) await fetchArtisans(ctx, message);
    await fetchAvailability(ctx, userId, role, intents, message);
    if (intents.includes('serviceRequests')) await fetchServiceRequests(ctx, userId, role, message);
    if (intents.includes('reviews')) await fetchReviews(ctx, userId);
    if (intents.includes('promo')) await fetchPromo(ctx, message);
    if (intents.includes('users')) await fetchUsers(ctx, message);

  } catch (err) {
    console.error('fetchContext error:', err.message);
  }

  return ctx;
}

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildMessages(user, context, message, history) {
  const hasContext = Object.keys(context).length > 0;

  const systemPrompt = `Tu es l'assistant IA de BMP.tn, une plateforme de construction en Tunisie.
Tu aides les artisans, prescripteurs et fournisseurs avec leurs questions.

Utilisateur: ${user.firstName} ${user.lastName}
Rôle: ${user.role}
Date: ${new Date().toLocaleDateString('fr-TN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

${hasContext ? `DONNÉES ACTUELLES DE L'UTILISATEUR:
${JSON.stringify(context, null, 2)}` : ''}

RÈGLES IMPORTANTES:
- Réponds TOUJOURS en français
- Sois concis, clair et utile
- Les données ci-dessus sont DÉJÀ FILTRÉES selon la demande — liste-les telles quelles sans re-filtrer
- Si les données sont vides ou tableau vide, réponds "Aucun résultat trouvé pour ce filtre"
- Le champ "artisansTotalCount" = nombre EXACT et COMPLET dans la base de données
- Ne fabrique JAMAIS de données (prix, noms, dates, statuts)
- Formate les listes avec des tirets (-)`;

  return [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8).map(h => ({ role: h.role === 'bot' ? 'assistant' : 'user', content: h.text })),
    { role: 'user', content: message },
  ];
}

// ── Stream Mistral response ───────────────────────────────────────────────────
async function streamChat(messages, res) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: true,
      options: { temperature: 0.3, num_predict: 600 },
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const { Readable } = require('stream');
  const nodeStream = Readable.fromWeb ? Readable.fromWeb(response.body) : response.body;

  let buffer = '';

  await new Promise((resolve, reject) => {
    nodeStream.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            res.write(`data: ${JSON.stringify({ text: data.message.content })}\n\n`);
          }
          if (data.done) {
            res.write('data: [DONE]\n\n');
          }
        } catch {}
      }
    });

    nodeStream.on('end', () => {
      res.write('data: [DONE]\n\n');
      resolve();
    });

    nodeStream.on('error', reject);
  });
}

module.exports = { detectIntents, fetchContext, buildMessages, streamChat };