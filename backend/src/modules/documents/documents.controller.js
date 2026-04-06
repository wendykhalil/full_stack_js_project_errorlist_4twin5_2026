const Devis = require('../../models/Devis');
const Facture = require('../../models/Facture');
const Project = require('../../models/Project');

function getUserId(req) {
  return req.user?._id || req.user?.id || req.user?.sub || req.user?.userId;
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
    const [quotes, invoices] = await Promise.all([
      Devis.find({ artisanId }).sort({ createdAt: -1 }).lean(),
      Facture.find({ artisanId }).sort({ createdAt: -1 }).lean(),
    ]);
    return res.json({ ok: true, quotes, invoices });
  } catch (err) {
    return next(err);
  }
}

async function createQuote(req, res, next) {
  try {
    const artisanId = getUserId(req);
    const { projectId, lines = [], taxRate = 0.19, discount = 0, status = 'DRAFT' } = req.body || {};
    if (!projectId) return res.status(400).json({ message: 'projectId is required' });

    const project = await Project.findById(projectId).lean();
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (String(project.artisanId) !== String(artisanId)) return res.status(403).json({ message: 'Forbidden' });

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
    if (!devisId) return res.status(400).json({ message: 'devisId is required' });

    const quote = await Devis.findById(devisId).lean();
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    if (String(quote.artisanId) !== String(artisanId)) return res.status(403).json({ message: 'Forbidden' });

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
  createQuote,
  createInvoice,
  normalizeLines,
  computeTotals,
};
