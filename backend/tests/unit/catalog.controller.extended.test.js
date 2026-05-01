'use strict';
jest.mock('../../src/modules/catalog/catalog.service');
jest.mock('../../src/models/Product');
jest.mock('../../src/models/Category');
jest.mock('../../src/modules/catalog/recommendations', () => ({
  buildRecommendationFilter: jest.fn().mockReturnValue({}),
  scoreRecommendations: jest.fn().mockReturnValue([]),
}));
jest.mock('../../src/modules/catalog/video.service', () => ({
  getProductVideo: jest.fn(),
}));
jest.mock('../../src/utils/apiResponse');

const Product = require('../../src/models/Product');
const Category = require('../../src/models/Category');
const { getProductVideo } = require('../../src/modules/catalog/video.service');
const apiResponse = require('../../src/utils/apiResponse');

const {
  getProducts,
  getProductById,
  getRecommendations,
  getVideo,
  rateProduct,
} = require('../../src/modules/catalog/catalog.controller');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides = {}) {
  return {
    user: { _id: 'user1' },
    body: {},
    params: {},
    query: {},
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  apiResponse.mockImplementation((res, msg, data) => res.json({ ok: true, message: msg, data }));
});

// ─── getVideo ─────────────────────────────────────────────────────────────────
describe('catalog.controller — getVideo', () => {
  it('returns 404 when product not found', async () => {
    Product.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });
    const req = mockReq({ params: { id: 'p1' } });
    const res = mockRes();
    await getVideo(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns null video when no video available', async () => {
    Product.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ _id: 'p1', name: 'Test' }),
    });
    getProductVideo.mockResolvedValue(null);
    const req = mockReq({ params: { id: 'p1' } });
    const res = mockRes();
    await getVideo(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Aucune vidéo disponible', { video: null });
  });

  it('returns video when available', async () => {
    Product.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ _id: 'p1', name: 'Test' }),
    });
    getProductVideo.mockResolvedValue({ url: 'https://youtube.com/watch?v=test' });
    const req = mockReq({ params: { id: 'p1' } });
    const res = mockRes();
    await getVideo(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Vidéo récupérée', { video: { url: 'https://youtube.com/watch?v=test' } });
  });

  it('returns 500 on error', async () => {
    Product.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error('DB error')),
    });
    const req = mockReq({ params: { id: 'p1' } });
    const res = mockRes();
    await getVideo(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getRecommendations ───────────────────────────────────────────────────────
describe('catalog.controller — getRecommendations (extended)', () => {
  it('returns 404 when product not found', async () => {
    Product.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });
    const req = mockReq({ params: { id: 'p1' } });
    const res = mockRes();
    await getRecommendations(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns recommendations', async () => {
    Product.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ _id: 'p1', name: 'Test', categoryId: 'c1' }),
    });
    Category.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: 'c1', name: 'Cat' }]) });
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    const req = mockReq({ params: { id: 'p1' } });
    const res = mockRes();
    await getRecommendations(req, res);
    expect(apiResponse).toHaveBeenCalled();
  });

  it('returns 500 on error', async () => {
    Product.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error('DB error')),
    });
    const req = mockReq({ params: { id: 'p1' } });
    const res = mockRes();
    await getRecommendations(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getProductById ───────────────────────────────────────────────────────────
describe('catalog.controller — getProductById (extended)', () => {
  it('returns 404 when product not found', async () => {
    Product.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });
    const req = mockReq({ params: { id: 'p1' } });
    const res = mockRes();
    await getProductById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on error', async () => {
    Product.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error('DB error')),
    });
    const req = mockReq({ params: { id: 'p1' } });
    const res = mockRes();
    await getProductById(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
