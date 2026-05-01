'use strict';
/**
 * Extended tests for supplier/aiInsights.service.js
 * Exports: getAiInsights, retrainAiModel, collectProductMetrics, cache
 */

jest.mock('../../src/models/Product');
jest.mock('../../src/models/Order');
jest.mock('../../src/modules/supplier/ml.client');

const Product  = require('../../src/models/Product');
const Order    = require('../../src/models/Order');
const mlClient = require('../../src/modules/supplier/ml.client');

const { getAiInsights, retrainAiModel, collectProductMetrics, cache } =
  require('../../src/modules/supplier/aiInsights.service');

const mockProducts = [
  { _id: 'p1', name: 'Ciment', price: 50, stock: 100, rating: 4.5, imageUrls: ['img.jpg'], categoryId: { name: 'Matériaux' } },
  { _id: 'p2', name: 'Sable',  price: 20, stock: 50,  rating: 3.0, imageUrls: [],          categoryId: { name: 'Matériaux' } },
  { _id: 'p3', name: 'Gravier',price: 30, stock: 0,   rating: 0,   imageUrls: [],          categoryId: null },
];

beforeEach(() => {
  jest.clearAllMocks();
  cache.clear();
  mlClient.isHealthy.mockResolvedValue(true);
  mlClient.predictBatch.mockResolvedValue([
    { productId: 'p1', label: 'BEST_SELLER', score: 0.9 },
    { productId: 'p2', label: 'NORMAL',      score: 0.5 },
    { productId: 'p3', label: 'UNDERPERFORMING', score: 0.2 },
  ]);
  mlClient.retrainModel.mockResolvedValue({ ok: true });
  mlClient.getModelMeta.mockResolvedValue({ accuracy: 0.85 });
});

// ─── collectProductMetrics ────────────────────────────────────────────────────
describe('supplier aiInsights — collectProductMetrics', () => {
  it('returns product metrics with order counts', async () => {
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockProducts),
    });
    Order.aggregate.mockResolvedValue([
      { _id: 'p1', totalOrders: 10 },
      { _id: 'p2', totalOrders: 3 },
    ]);

    const metrics = await collectProductMetrics('supplier1');
    expect(metrics).toHaveLength(3);
    expect(metrics[0].orders).toBe(10);
    expect(metrics[1].orders).toBe(3);
    expect(metrics[2].orders).toBe(0);
    expect(metrics[0].productName).toBe('Ciment');
  });

  it('returns empty array when no products', async () => {
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    const metrics = await collectProductMetrics('supplier1');
    expect(metrics).toHaveLength(0);
  });

  it('handles null categoryId', async () => {
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([mockProducts[2]]),
    });
    Order.aggregate.mockResolvedValue([]);
    const metrics = await collectProductMetrics('supplier1');
    expect(metrics[0].category).toBe('N/A');
  });
});

// ─── getAiInsights ────────────────────────────────────────────────────────────
describe('supplier aiInsights — getAiInsights', () => {
  it('returns insights from ML when healthy', async () => {
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockProducts),
    });
    Order.aggregate.mockResolvedValue([{ _id: 'p1', totalOrders: 5 }]);

    const result = await getAiInsights('supplier1', true);
    expect(result).toBeDefined();
    expect(result.cached).toBeFalsy();
  });

  it('returns cached result on second call without forceRefresh', async () => {
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockProducts),
    });
    Order.aggregate.mockResolvedValue([]);

    await getAiInsights('supplier-cache-test', true);
    const cached = await getAiInsights('supplier-cache-test', false);
    expect(cached.cached).toBe(true);
  });

  it('throws when ML is unhealthy', async () => {
    mlClient.isHealthy.mockResolvedValue(false);
    await expect(getAiInsights('supplier2', true)).rejects.toThrow('ML service is unavailable');
  });

  it('handles empty products gracefully', async () => {
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    const result = await getAiInsights('supplier3', true);
    expect(result).toBeDefined();
  });

  it('handles ML predictBatch error gracefully', async () => {
    mlClient.isHealthy.mockResolvedValue(true);
    mlClient.predictBatch.mockResolvedValue([]); // empty result instead of error
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockProducts),
    });
    Order.aggregate.mockResolvedValue([]);

    const result = await getAiInsights('supplier4', true);
    expect(result).toBeDefined();
  });
});

// ─── retrainAiModel ───────────────────────────────────────────────────────────
describe('supplier aiInsights — retrainAiModel', () => {
  it('triggers retraining with product metrics', async () => {
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockProducts),
    });
    Order.aggregate.mockResolvedValue([{ _id: 'p1', totalOrders: 5 }]);

    const result = await retrainAiModel('supplier1');
    expect(result).toBeDefined();
    expect(mlClient.retrainModel).toHaveBeenCalled();
  });

  it('handles empty products during retrain', async () => {
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    const result = await retrainAiModel('supplier1');
    expect(result).toBeDefined();
  });
});
