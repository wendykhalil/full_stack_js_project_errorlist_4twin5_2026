'use strict';
jest.mock('../../src/models/Devis');
jest.mock('../../src/models/Facture');
jest.mock('../../src/models/Project');
jest.mock('../../src/models/ActivityLog');
jest.mock('../../src/utils/ipGeo', () => ({
  lookupIpGeo: jest.fn().mockResolvedValue({ country: 'TN', countryCode: 'TN' }),
  isPrivateOrLocal: jest.fn().mockReturnValue(false),
}));

const Devis = require('../../src/models/Devis');
const Facture = require('../../src/models/Facture');
const Project = require('../../src/models/Project');
const ActivityLog = require('../../src/models/ActivityLog');

const {
  listMyDocuments,
  listMyDocumentActivity,
  createQuote,
  createInvoice,
  normalizeLines,
  computeTotals,
} = require('../../src/modules/documents/documents.controller');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides = {}) {
  return {
    user: { _id: 'artisan1' },
    body: {},
    params: {},
    query: {},
    headers: {},
    ip: '127.0.0.1',
    get: jest.fn().mockReturnValue('Mozilla/5.0'),
    ...overrides,
  };
}

const next = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  ActivityLog.create = jest.fn().mockResolvedValue({});
});

// ─── normalizeLines ───────────────────────────────────────────────────────────
describe('documents.controller — normalizeLines', () => {
  it('normalizes valid lines', () => {
    const lines = [
      { description: 'Item 1', quantity: 2, unitPrice: 100 },
      { description: 'Item 2', quantity: 1, unitPrice: 50 },
    ];
    const result = normalizeLines(lines);
    expect(result).toHaveLength(2);
    expect(result[0].lineTotal).toBe(200);
    expect(result[1].lineTotal).toBe(50);
  });

  it('filters out lines with no description', () => {
    const lines = [
      { description: '', quantity: 2, unitPrice: 100 },
      { description: 'Valid', quantity: 1, unitPrice: 50 },
    ];
    const result = normalizeLines(lines);
    expect(result).toHaveLength(1);
  });

  it('filters out lines with zero quantity', () => {
    const lines = [
      { description: 'Item', quantity: 0, unitPrice: 100 },
    ];
    const result = normalizeLines(lines);
    expect(result).toHaveLength(0);
  });

  it('handles empty array', () => {
    expect(normalizeLines([])).toEqual([]);
  });

  it('handles non-array input', () => {
    expect(normalizeLines(null)).toEqual([]);
  });
});

// ─── computeTotals ────────────────────────────────────────────────────────────
describe('documents.controller — computeTotals', () => {
  it('computes totals correctly', () => {
    const lines = [{ lineTotal: 100 }, { lineTotal: 200 }];
    const result = computeTotals(lines, 0.19, 0);
    expect(result.subTotal).toBe(300);
    expect(result.taxAmount).toBe(57);
    expect(result.total).toBe(357);
  });

  it('applies discount', () => {
    const lines = [{ lineTotal: 100 }];
    const result = computeTotals(lines, 0.19, 10);
    expect(result.total).toBe(109);
  });

  it('handles empty lines', () => {
    const result = computeTotals([], 0.19, 0);
    expect(result.subTotal).toBe(0);
    expect(result.total).toBe(0);
  });
});

// ─── listMyDocuments ──────────────────────────────────────────────────────────
describe('documents.controller — listMyDocuments', () => {
  it('returns quotes and invoices', async () => {
    Devis.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: 'q1', projectId: { title: 'Proj' } }]),
    });
    Facture.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: 'f1', projectId: { title: 'Proj' } }]),
    });
    const req = mockReq();
    const res = mockRes();
    await listMyDocuments(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, quotes: expect.any(Array), invoices: expect.any(Array) }));
  });

  it('calls next on error', async () => {
    Devis.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error('DB error')),
    });
    const req = mockReq();
    const res = mockRes();
    await listMyDocuments(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ─── listMyDocumentActivity ───────────────────────────────────────────────────
describe('documents.controller — listMyDocumentActivity', () => {
  it('returns activity logs', async () => {
    ActivityLog.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: 'log1', action: 'QUOTE_CREATE' }]),
    });
    const req = mockReq({ query: { limit: '20' } });
    const res = mockRes();
    await listMyDocumentActivity(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  it('uses default limit when not provided', async () => {
    ActivityLog.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    const req = mockReq();
    const res = mockRes();
    await listMyDocumentActivity(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  it('calls next on error', async () => {
    ActivityLog.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error('DB error')),
    });
    const req = mockReq();
    const res = mockRes();
    await listMyDocumentActivity(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ─── createQuote ──────────────────────────────────────────────────────────────
describe('documents.controller — createQuote', () => {
  it('returns 400 when projectId missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    await createQuote(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when project not found', async () => {
    Project.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const req = mockReq({ body: { projectId: 'p1' } });
    const res = mockRes();
    await createQuote(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when not project owner', async () => {
    Project.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'p1', artisanId: 'other', title: 'Test' }),
    });
    const req = mockReq({ body: { projectId: 'p1' } });
    const res = mockRes();
    await createQuote(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('creates quote successfully', async () => {
    Project.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'p1', artisanId: 'artisan1', title: 'Test' }),
    });
    Devis.create.mockResolvedValue({ _id: 'q1', total: 357 });
    const req = mockReq({
      body: {
        projectId: 'p1',
        lines: [{ description: 'Item', quantity: 2, unitPrice: 150 }],
        taxRate: 0.19,
        discount: 0,
      },
    });
    const res = mockRes();
    await createQuote(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  it('adds trial info when isTrialAttempt', async () => {
    Project.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'p1', artisanId: 'artisan1', title: 'Test' }),
    });
    Devis.create.mockResolvedValue({ _id: 'q1', total: 100 });
    const req = mockReq({ body: { projectId: 'p1' }, isTrialAttempt: true });
    const res = mockRes();
    await createQuote(req, res, next);
    const call = res.json.mock.calls[0][0];
    expect(call.trialInfo).toBeDefined();
  });

  it('calls next on error', async () => {
    Project.findById.mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error('DB error')),
    });
    const req = mockReq({ body: { projectId: 'p1' } });
    const res = mockRes();
    await createQuote(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ─── createInvoice ────────────────────────────────────────────────────────────
describe('documents.controller — createInvoice', () => {
  it('returns 400 when devisId missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    await createInvoice(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when quote not found', async () => {
    Devis.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const req = mockReq({ body: { devisId: 'd1' } });
    const res = mockRes();
    await createInvoice(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when not quote owner', async () => {
    Devis.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'd1', artisanId: 'other', projectId: 'p1' }),
    });
    const req = mockReq({ body: { devisId: 'd1' } });
    const res = mockRes();
    await createInvoice(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('creates invoice successfully', async () => {
    Devis.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: 'd1', artisanId: 'artisan1', projectId: 'p1',
        lines: [], subTotal: 100, taxRate: 0.19, taxAmount: 19, discount: 0, total: 119,
      }),
    });
    Facture.create.mockResolvedValue({ _id: 'f1' });
    Project.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ _id: 'p1', title: 'Test Project' }),
    });
    const req = mockReq({ body: { devisId: 'd1', dueDate: '2025-12-31' } });
    const res = mockRes();
    await createInvoice(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  it('adds trial info when isTrialAttempt', async () => {
    Devis.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: 'd1', artisanId: 'artisan1', projectId: 'p1',
        lines: [], subTotal: 100, taxRate: 0.19, taxAmount: 19, discount: 0, total: 119,
      }),
    });
    Facture.create.mockResolvedValue({ _id: 'f1' });
    Project.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ _id: 'p1', title: 'Test' }),
    });
    const req = mockReq({ body: { devisId: 'd1' }, isTrialAttempt: true });
    const res = mockRes();
    await createInvoice(req, res, next);
    const call = res.json.mock.calls[0][0];
    expect(call.trialInfo).toBeDefined();
  });

  it('calls next on error', async () => {
    Devis.findById.mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error('DB error')),
    });
    const req = mockReq({ body: { devisId: 'd1' } });
    const res = mockRes();
    await createInvoice(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
