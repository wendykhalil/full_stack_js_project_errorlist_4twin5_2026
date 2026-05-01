'use strict';
/**
 * Unit tests for ml.client.js
 */

const { predictBatch, retrainModel, getModelMeta, isHealthy } =
  require('../../src/modules/supplier/ml.client');

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

beforeEach(() => jest.clearAllMocks());

// ─── predictBatch ─────────────────────────────────────────────────────────────
describe('ml.client — predictBatch', () => {
  it('returns results on success', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      results: [{ productId: 'p1', label: 'BEST_SELLER', score: 0.9 }]
    }));
    const result = await predictBatch([{ productId: 'p1', price: 50, stock: 100 }]);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('BEST_SELLER');
  });

  it('returns empty array when results missing', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }));
    const result = await predictBatch([]);
    expect(result).toEqual([]);
  });

  it('throws when ML service returns non-ok', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Bad request' }, 400));
    await expect(predictBatch([{ productId: 'p1' }])).rejects.toThrow('ML service responded 400');
  });

  it('throws on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(predictBatch([{ productId: 'p1' }])).rejects.toThrow('Network error');
  });

  it('throws timeout error on AbortError', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);
    await expect(predictBatch([{ productId: 'p1' }])).rejects.toThrow('ML service timed out');
  });
});

// ─── retrainModel ─────────────────────────────────────────────────────────────
describe('ml.client — retrainModel', () => {
  it('returns retrain result on success', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      status: 'ok', message: 'Model retrained', accuracy: 0.85, samples_used: 100
    }));
    const result = await retrainModel([{ price: 50, stock: 10, orders: 5, rating: 4 }]);
    expect(result.status).toBe('ok');
    expect(result.accuracy).toBe(0.85);
  });

  it('throws when retrain fails', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Not enough data' }, 422));
    await expect(retrainModel([])).rejects.toThrow('Not enough data');
  });

  it('throws timeout on AbortError', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);
    await expect(retrainModel([])).rejects.toThrow('ML retrain timed out');
  });

  it('throws on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));
    await expect(retrainModel([])).rejects.toThrow('Connection refused');
  });
});

// ─── getModelMeta ─────────────────────────────────────────────────────────────
describe('ml.client — getModelMeta', () => {
  it('returns meta on success', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      meta: { lastTrainedAt: '2024-01-01', samplesUsed: 100, accuracy: 0.9 }
    }));
    const result = await getModelMeta();
    expect(result.accuracy).toBe(0.9);
  });

  it('returns null when service returns non-ok', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 503));
    const result = await getModelMeta();
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const result = await getModelMeta();
    expect(result).toBeNull();
  });

  it('returns null when meta field missing', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ ok: true }));
    const result = await getModelMeta();
    expect(result).toBeNull();
  });
});

// ─── isHealthy ────────────────────────────────────────────────────────────────
describe('ml.client — isHealthy', () => {
  it('returns true when service is healthy', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ status: 'ok' }));
    const result = await isHealthy();
    expect(result).toBe(true);
  });

  it('returns false when service returns non-ok', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 503));
    const result = await isHealthy();
    expect(result).toBe(false);
  });

  it('returns false on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));
    const result = await isHealthy();
    expect(result).toBe(false);
  });
});
