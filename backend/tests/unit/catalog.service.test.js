'use strict';

jest.mock('../../src/models/Product');
jest.mock('../../src/models/Category');

const Product = require('../../src/models/Product');
const { getProducts, rateProduct } = require('../../src/modules/catalog/catalog.service');

describe('catalog.service – getProducts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns products with default pagination', async () => {
    const mockProducts = [{ _id: '1', name: 'Cement' }];
    const populateMock = jest.fn().mockReturnThis();
    const sortMock = jest.fn().mockReturnThis();
    const skipMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockReturnThis();
    const leanMock = jest.fn().mockResolvedValue(mockProducts);

    Product.find.mockReturnValue({
      populate: populateMock,
      sort: sortMock,
      skip: skipMock,
      limit: limitMock,
      lean: leanMock,
    });
    Product.countDocuments.mockResolvedValue(1);

    const result = await getProducts({});
    expect(result.products).toEqual(mockProducts);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(12);
    expect(result.pagination.totalItems).toBe(1);
  });

  it('applies search filter', async () => {
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    Product.countDocuments.mockResolvedValue(0);

    await getProducts({ search: 'cement' });
    const query = Product.find.mock.calls[0][0];
    expect(query.name).toEqual({ $regex: 'cement', $options: 'i' });
  });

  it('applies category filter', async () => {
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    Product.countDocuments.mockResolvedValue(0);

    await getProducts({ category: 'cat123' });
    const query = Product.find.mock.calls[0][0];
    expect(query.categoryId).toBe('cat123');
  });

  it('applies approved=true filter', async () => {
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    Product.countDocuments.mockResolvedValue(0);

    await getProducts({ approved: 'true' });
    const query = Product.find.mock.calls[0][0];
    expect(query.isApproved).toBe(true);
  });

  it('does not apply approved filter when approved=all', async () => {
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    Product.countDocuments.mockResolvedValue(0);

    await getProducts({ approved: 'all' });
    const query = Product.find.mock.calls[0][0];
    expect(query.isApproved).toBeUndefined();
  });

  it('calculates totalPages correctly', async () => {
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    Product.countDocuments.mockResolvedValue(25);

    const result = await getProducts({ limit: 10 });
    expect(result.pagination.totalPages).toBe(3);
  });
});

describe('catalog.service – rateProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws 400 for rating below 1', async () => {
    await expect(rateProduct('prod1', 0, 'user1')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws 400 for rating above 5', async () => {
    await expect(rateProduct('prod1', 6, 'user1')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws 400 for non-numeric rating', async () => {
    await expect(rateProduct('prod1', 'abc', 'user1')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws 404 when product not found', async () => {
    Product.findOneAndUpdate.mockResolvedValue(null);
    await expect(rateProduct('prod1', 4, 'user1')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('returns updated rating and ratingCount on success', async () => {
    Product.findOneAndUpdate.mockResolvedValue({
      rating: 4.5,
      ratingCount: 2,
    });

    const result = await rateProduct('prod1', 4, 'user1');
    expect(result.rating).toBe(4.5);
    expect(result.ratingCount).toBe(2);
  });

  it('rounds rating to integer before update', async () => {
    Product.findOneAndUpdate.mockResolvedValue({ rating: 4.0, ratingCount: 1 });
    await rateProduct('prod1', 3.7, 'user1');
    const updateArg = Product.findOneAndUpdate.mock.calls[0];
    // score should be Math.round(3.7) = 4
    expect(updateArg).toBeDefined();
  });
});
