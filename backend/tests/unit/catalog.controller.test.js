'use strict';

jest.mock('../../src/modules/catalog/catalog.service');
jest.mock('../../src/models/Product');
jest.mock('../../src/models/Category');
jest.mock('../../src/modules/catalog/recommendations', () => ({
  buildRecommendationFilter: jest.fn().mockReturnValue({}),
  scoreRecommendations: jest.fn().mockReturnValue([]),
}));
jest.mock('../../src/modules/catalog/video.service', () => ({
  getProductVideo: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../src/utils/apiResponse');

const catalogService = require('../../src/modules/catalog/catalog.service');
const Product = require('../../src/models/Product');
const Category = require('../../src/models/Category');
const apiResponse = require('../../src/utils/apiResponse');
const { getProducts, getProductById, getRecommendations, getVideo, rateProduct } = require('../../src/modules/catalog/catalog.controller');

function makeReq(overrides = {}) {
  return {
    query: {},
    params: {},
    body: {},
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

describe('catalog.controller – getProducts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls catalogService.getProducts and returns apiResponse', async () => {
    catalogService.getProducts.mockResolvedValue({ products: [], pagination: {} });
    const req = makeReq({ query: { page: '1', limit: '8' } });
    const res = makeRes();
    await getProducts(req, res);
    expect(catalogService.getProducts).toHaveBeenCalled();
    expect(apiResponse).toHaveBeenCalled();
  });

  it('returns 400 on service error', async () => {
    catalogService.getProducts.mockRejectedValue(new Error('DB error'));
    const req = makeReq();
    const res = makeRes();
    await getProducts(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'DB error', null, 400);
  });
});

describe('catalog.controller – getProductById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 when product not found', async () => {
    Product.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });
    const req = makeReq({ params: { id: 'prod1' } });
    const res = makeRes();
    await getProductById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Produit non trouvé' });
  });

  it('returns product when found', async () => {
    const mockProduct = { _id: 'prod1', name: 'Cement' };
    Product.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockProduct),
    });
    const req = makeReq({ params: { id: 'prod1' } });
    const res = makeRes();
    await getProductById(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Produit récupéré', mockProduct);
  });

  it('returns 500 on unexpected error', async () => {
    Product.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error('DB fail')),
    });
    const req = makeReq({ params: { id: 'prod1' } });
    const res = makeRes();
    await getProductById(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('catalog.controller – getRecommendations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 when product not found', async () => {
    Product.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });
    const req = makeReq({ params: { id: 'prod1' } });
    const res = makeRes();
    await getRecommendations(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns recommendations when product found', async () => {
    const mockProduct = { _id: 'prod1', name: 'Cement', categoryId: { _id: 'cat1' } };
    Product.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockProduct),
    });
    Category.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    const req = makeReq({ params: { id: 'prod1' } });
    const res = makeRes();
    await getRecommendations(req, res);
    expect(apiResponse).toHaveBeenCalled();
  });
});

describe('catalog.controller – rateProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls catalogService.rateProduct and returns result', async () => {
    catalogService.rateProduct.mockResolvedValue({ rating: 4.5, ratingCount: 3 });
    Product.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ supplierId: 'sup1' }),
    });
    const req = makeReq({ params: { id: 'prod1' }, body: { rating: 4 } });
    const res = makeRes();
    await rateProduct(req, res);
    expect(catalogService.rateProduct).toHaveBeenCalledWith('prod1', 4, 'user1');
    expect(apiResponse).toHaveBeenCalled();
  });

  it('returns error status on service failure', async () => {
    const err = new Error('Invalid rating');
    err.statusCode = 400;
    catalogService.rateProduct.mockRejectedValue(err);
    const req = makeReq({ params: { id: 'prod1' }, body: { rating: 0 } });
    const res = makeRes();
    await rateProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid rating' });
  });
});
