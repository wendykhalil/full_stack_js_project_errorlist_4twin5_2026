const Devis = require('../../models/Devis');
const Facture = require('../../models/Facture');
const Project = require('../../models/Project');
const ActivityLog = require('../../models/ActivityLog');
const { lookupIpGeo, isPrivateOrLocal } = require('../../utils/ipGeo');

function getUserId(req) {
  return req.user?._id || req.user?.id || req.user?.sub || req.user?.userId;
}

function normalizeIp(ip) {
  const raw = String(ip || '').trim();
  if (!raw) return '';
  const clean = raw.split(',')[0].trim();
  if (clean.startsWith('::ffff:')) return clean.slice(7);
  return clean;
}

function getRequestMeta(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const clientIp = req.headers['x-client-ip'];
  const fallbackIp = normalizeIp(Array.isArray(forwarded) ? forwarded[0] : forwarded) || normalizeIp(realIp) || normalizeIp(req.ip) || '';
  const ip = (!fallbackIp || isPrivateOrLocal(fallbackIp)) ? normalizeIp(clientIp) || fallbackIp : fallbackIp;
  const userAgent = req.get('user-agent') || '';
  const country = String(req.headers['x-client-country'] || '').trim();
  const countryCode = String(req.headers['x-client-country-code'] || '').trim();
  return { ip, userAgent, country, countryCode };
}

async function logActivity(req, userId, action, details = {}) {
  try {
    const { ip, userAgent, country: clientCountry, countryCode: clientCountryCode } = getRequestMeta(req);
    const geo = await lookupIpGeo(ip, { country: clientCountry, countryCode: clientCountryCode });
    await ActivityLog.create({
      user: userId,
      action,
      details,
      ip,
      country: geo.country || clientCountry || '',
      countryCode: geo.countryCode || clientCountryCode || '',
      userAgent,
    });
  } catch (_) {}
}

function normalizeLines(lines = []) {
  return (Array.isArray(lines) ? lines : []).map((line) => {
    const quantity = Number(line.quantity || 0);
    const unitPrice = Number(line.unitPrice || 0);
    return {
      description: String(line.description || '').trim(),
      quantity,
      unitPrice,
      lineTotal: Number((quantity * unitPrice).toFixed(3)),
    };
  }).filter((line) => line.description && line.quantity > 0);
}

function computeTotals(lines, taxRate = 0.19, discount = 0) {
  const subTotal = Number(lines.reduce((sum, line) => sum + line.lineTotal, 0).toFixed(3));
  const taxAmount = Number((subTotal * taxRate).toFixed(3));
  const total = Number((subTotal + taxAmount - discount).toFixed(3));
  return { subTotal, taxAmount, total };
}

async function listMyDocuments(req, res, next) {
  try {
    const artisanId = getUserId(req);
    const [quotesRaw, invoicesRaw] = await Promise.all([
      Devis.find({ artisanId }).sort({ createdAt: -1 }).populate('projectId', 'title').lean(),
      Facture.find({ artisanId }).sort({ createdAt: -1 }).populate('projectId', 'title').lean(),
    ]);

    const quotes = (quotesRaw || []).map((quote) => ({
      ...quote,
      projectTitle:
        quote?.projectTitle ||
        quote?.projectName ||
        quote?.projectId?.title ||
        '',
      project: quote?.projectId || null,
    }));

    const invoices = (invoicesRaw || []).map((invoice) => ({
      ...invoice,
      projectTitle:
        invoice?.projectTitle ||
        invoice?.projectName ||
        invoice?.projectId?.title ||
        '',
      project: invoice?.projectId || null,
    }));

    return res.json({ ok: true, quotes, invoices });
  } catch (err) {
    return next(err);
  }
}

async function listMyDocumentActivity(req, res, next) {
  try {
    const artisanId = getUserId(req);
    const limit = Math.min(100, Math.max(10, Number(req.query.limit || 50)));

    const items = await ActivityLog.find({
      user: artisanId,
      action: { $in: ['QUOTE_CREATE', 'INVOICE_CREATE'] },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ ok: true, items });
  } catch (err) {
    return next(err);
  }
}

async function createQuote(req, res, next) {
  try {
    const artisanId = getUserId(req);
    const { projectId, lines = [], taxRate = 0.19, discount = 0, status = 'DRAFT' } = req.body || {};
    if (!projectId) return res.status(400).json({ message: 'projectId est requis' });

    const project = await Project.findById(projectId).lean();
    if (!project) return res.status(404).json({ message: 'Projet introuvable' });
    if (String(project.artisanId) !== String(artisanId)) return res.status(403).json({ message: 'Accès interdit' });

    const normalizedLines = normalizeLines(lines);
    const totals = computeTotals(normalizedLines, Number(taxRate), Number(discount));

    const quote = await Devis.create({
      projectId,
      artisanId,
      lines: normalizedLines,
      taxRate: Number(taxRate),
      discount: Number(discount),
      status,
      ...totals,
    });

    await logActivity(req, artisanId, 'QUOTE_CREATE', {
      quoteId: quote._id,
      projectId,
      projectTitle: project.title || '',
      lineCount: normalizedLines.length,
      total: totals.total,
      status,
    });

    const response = { ok: true, quote };

    // Add trial information if this was a trial attempt
    if (req.isTrialAttempt) {
      response.trialInfo = {
        isTrialAttempt: true,
        message: 'Ceci est votre essai gratuit pour créer des devis. Vous devez vous abonner pour en créer d\'autres.',
      };
    }

    return res.status(201).json(response);
  } catch (err) {
    return next(err);
  }
}

async function createInvoice(req, res, next) {
  try {
    const artisanId = getUserId(req);
    const { devisId, dueDate, status = 'DRAFT' } = req.body || {};
    if (!devisId) return res.status(400).json({ message: 'devisId est requis' });

    const quote = await Devis.findById(devisId).lean();
    if (!quote) return res.status(404).json({ message: 'Devis introuvable' });
    if (String(quote.artisanId) !== String(artisanId)) return res.status(403).json({ message: 'Accès interdit' });

    const invoice = await Facture.create({
      devisId,
      projectId: quote.projectId,
      artisanId,
      lines: quote.lines,
      subTotal: quote.subTotal,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      discount: quote.discount,
      total: quote.total,
      status,
      ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
    });

    const project = await Project.findById(quote.projectId).select('title').lean();
    await logActivity(req, artisanId, 'INVOICE_CREATE', {
      invoiceId: invoice._id,
      quoteId: devisId,
      projectId: quote.projectId,
      projectTitle: project?.title || '',
      total: quote.total,
      status,
    });

    const response = { ok: true, invoice };

    // Add trial information if this was a trial attempt
    if (req.isTrialAttempt) {
      response.trialInfo = {
        isTrialAttempt: true,
        message: 'Ceci est votre essai gratuit pour créer des factures. Vous devez vous abonner pour en créer d\'autres.',
      };
    }

    return res.status(201).json(response);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listMyDocuments,
  listMyDocumentActivity,
  createQuote,
  createInvoice,
  normalizeLines,
  computeTotals,
};
