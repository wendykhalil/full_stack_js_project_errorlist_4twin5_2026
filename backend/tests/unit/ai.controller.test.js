'use strict';

jest.mock('../../src/modules/ai-assistant/ai.service', () => ({
  suggestProject: jest.fn(),
  suggestProduct: jest.fn(),
  suggestQuoteFromProject: jest.fn(),
  smartSearch: jest.fn(),
}));
jest.mock('../../src/models/Project');

const aiService = require('../../src/modules/ai-assistant/ai.service');
const Project = require('../../src/models/Project');
const {
  suggestProject,
  suggestProduct,
  suggestQuoteFromProject,
  smartSearch,
} = require('../../src/modules/ai-assistant/ai.controller');

function makeReq(overrides = {}) {
  return {
    body: {},
    query: {},
    params: {},
    user: { _id: 'user1' },
    ...overrides,
  };
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

const next = jest.fn();

describe('ai.controller – suggestProject', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns suggestion on success', async () => {
    aiService.suggestProject.mockResolvedValue({ suggestion: 'Build a wall' });
    const req = makeReq({ body: { description: 'renovation' } });
    const res = makeRes();
    await suggestProject(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ ok: true, data: { suggestion: 'Build a wall' } });
  });

  it('calls next on error', async () => {
    aiService.suggestProject.mockRejectedValue(new Error('AI fail'));
    const req = makeReq();
    const res = makeRes();
    await suggestProject(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('ai.controller – suggestProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns product suggestion', async () => {
    aiService.suggestProduct.mockResolvedValue({ products: ['Cement'] });
    const req = makeReq({ body: { category: 'materials' } });
    const res = makeRes();
    await suggestProduct(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ ok: true, data: { products: ['Cement'] } });
  });

  it('calls next on error', async () => {
    aiService.suggestProduct.mockRejectedValue(new Error('fail'));
    const req = makeReq();
    const res = makeRes();
    await suggestProduct(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('ai.controller – suggestQuoteFromProject', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when projectId missing', async () => {
    const req = makeReq({ body: {} });
    const res = makeRes();
    await suggestQuoteFromProject(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'projectId est requis' });
  });

  it('returns 404 when project not found', async () => {
    Project.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const req = makeReq({ body: { projectId: 'proj1' } });
    const res = makeRes();
    await suggestQuoteFromProject(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when project belongs to different artisan', async () => {
    Project.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'proj1', artisanId: 'other_user' }),
    });
    const req = makeReq({ body: { projectId: 'proj1' }, user: { _id: 'user1' } });
    const res = makeRes();
    await suggestQuoteFromProject(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns quote suggestion on success', async () => {
    const mockProject = { _id: 'proj1', artisanId: 'user1' };
    Project.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockProject) });
    aiService.suggestQuoteFromProject.mockResolvedValue({ lines: [] });
    const req = makeReq({ body: { projectId: 'proj1' }, user: { _id: 'user1' } });
    const res = makeRes();
    await suggestQuoteFromProject(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ ok: true, data: { lines: [] } });
  });
});

describe('ai.controller – smartSearch', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns search results', async () => {
    aiService.smartSearch.mockResolvedValue({ results: [] });
    const req = makeReq({ query: { q: 'cement', scope: 'products', limit: '5' } });
    const res = makeRes();
    await smartSearch(req, res, next);
    expect(aiService.smartSearch).toHaveBeenCalledWith({ q: 'cement', scope: 'products', limit: 5 });
    expect(res.json).toHaveBeenCalledWith({ ok: true, data: { results: [] } });
  });

  it('uses defaults when query params missing', async () => {
    aiService.smartSearch.mockResolvedValue({});
    const req = makeReq({ query: {} });
    const res = makeRes();
    await smartSearch(req, res, next);
    expect(aiService.smartSearch).toHaveBeenCalledWith({ q: '', scope: 'all', limit: 8 });
  });

  it('calls next on error', async () => {
    aiService.smartSearch.mockRejectedValue(new Error('fail'));
    const req = makeReq({ query: {} });
    const res = makeRes();
    await smartSearch(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
