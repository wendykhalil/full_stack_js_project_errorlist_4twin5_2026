'use strict';
jest.mock('../../src/models/User');
jest.mock('../../src/models/Order');
jest.mock('../../src/models/Subscription');
jest.mock('../../src/models/Facture');
jest.mock('../../src/models/ActivityLog');
jest.mock('../../src/models/AuthLog');

// Mock fetch BEFORE requiring the service
const mockFetch = jest.fn();
global.fetch = mockFetch;

const User = require('../../src/models/User');
const Order = require('../../src/models/Order');
const Subscription = require('../../src/models/Subscription');
const Facture = require('../../src/models/Facture');
const ActivityLog = require('../../src/models/ActivityLog');
const AuthLog = require('../../src/models/AuthLog');

// Require service AFTER mocks are set up
const { getAiInsights } = require('../../src/modules/admin/aiInsights.service');

function setupDefaultMocks() {
  User.countDocuments.mockResolvedValue(100);
  User.aggregate.mockResolvedValue([
    { _id: 'ARTISAN', count: 50 },
    { _id: 'PRESCRIPTEUR', count: 30 },
  ]);
  Order.countDocuments.mockResolvedValue(50);
  Order.aggregate.mockResolvedValue([]);
  Order.find.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([]),
  });
  Subscription.countDocuments.mockResolvedValue(20);
  Facture.countDocuments.mockResolvedValue(10);
  ActivityLog.aggregate.mockResolvedValue([]);
  AuthLog.aggregate.mockResolvedValue([]);
  // Default: fetch fails (Ollama unavailable)
  mockFetch.mockRejectedValue(new Error('Connection refused'));
}

beforeEach(() => {
  jest.clearAllMocks();
  setupDefaultMocks();
});

describe('admin.aiInsights.service — getAiInsights', () => {
  it('returns heuristic insights when Ollama unavailable', async () => {
    const result = await getAiInsights(30, true);

    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.positives).toBeInstanceOf(Array);
    expect(result.risks).toBeInstanceOf(Array);
    expect(result.recommendations).toBeInstanceOf(Array);
    expect(typeof result.score).toBe('number');
    expect(result.source).toBe('heuristic');
  });

  it('returns cached result on second call without forceRefresh', async () => {
    await getAiInsights(30, true); // populate cache
    const result = await getAiInsights(30, false); // use cache
    expect(result.cached).toBe(true);
  });

  it('returns AI insights when Ollama available', async () => {
    const aiResponse = {
      summary: 'Platform is healthy',
      positives: ['Good growth'],
      risks: ['High cancellation'],
      recommendations: ['Improve onboarding'],
      score: 75,
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ response: JSON.stringify(aiResponse) }),
    });

    const result = await getAiInsights(30, true);
    expect(result.source).toBe('ai');
    expect(result.score).toBe(75);
  });

  it('falls back to heuristic when AI response is malformed', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ response: 'not valid json at all !!!' }),
    });

    const result = await getAiInsights(30, true);
    expect(result.source).toBe('heuristic');
  });

  it('falls back to heuristic when AI response shape is incomplete', async () => {
    const incompleteResponse = { summary: 'OK' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ response: JSON.stringify(incompleteResponse) }),
    });

    const result = await getAiInsights(30, true);
    expect(result.source).toBe('heuristic');
  });

  it('falls back when Ollama returns non-ok status', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });

    const result = await getAiInsights(30, true);
    expect(result.source).toBe('heuristic');
  });

  it('includes metrics in result', async () => {
    const result = await getAiInsights(30, true);
    expect(result.metrics).toBeDefined();
    expect(result.metrics.totalUsers).toBeDefined();
    expect(result.generatedAt).toBeDefined();
  });

  it('handles revenue data correctly', async () => {
    Order.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ lineTotal: 5000 }, { lineTotal: 3000 }]),
    });

    const result = await getAiInsights(30, true);
    expect(result.metrics.deliveredRevenue).toBe(8000);
  });

  it('handles high cancellation rate in heuristic', async () => {
    Order.aggregate
      .mockResolvedValueOnce([
        { _id: 'PENDING', count: 5 },
        { _id: 'CANCELLED', count: 20 },
        { _id: 'DELIVERED', count: 10 },
      ])
      .mockResolvedValue([]);

    const result = await getAiInsights(30, true);
    expect(result).toBeDefined();
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('handles user growth data', async () => {
    User.countDocuments
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(80)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(30)
      .mockResolvedValue(15);

    const result = await getAiInsights(30, true);
    expect(result.positives.length).toBeGreaterThan(0);
  });

  it('clamps score between 0 and 100', async () => {
    const result = await getAiInsights(30, true);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
