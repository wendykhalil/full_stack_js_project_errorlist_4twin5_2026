'use strict';

jest.mock('../../src/models/User');
jest.mock('../../src/models/Order');
jest.mock('../../src/models/ActivityLog');
jest.mock('../../src/models/AuthLog');

// Mock Subscription and Facture (may not exist as separate files)
jest.mock('../../src/models/Subscription', () => ({ countDocuments: jest.fn() }), { virtual: true });
jest.mock('../../src/models/Facture', () => ({ countDocuments: jest.fn() }), { virtual: true });

const User = require('../../src/models/User');
const Order = require('../../src/models/Order');
const ActivityLog = require('../../src/models/ActivityLog');
const AuthLog = require('../../src/models/AuthLog');

// Mock global fetch
global.fetch = jest.fn();

describe('aiInsights.service – getAiInsights', () => {
  let getAiInsights;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Re-mock after resetModules
    jest.mock('../../src/models/User');
    jest.mock('../../src/models/Order');
    jest.mock('../../src/models/ActivityLog');
    jest.mock('../../src/models/AuthLog');
    jest.mock('../../src/models/Subscription', () => ({ countDocuments: jest.fn().mockResolvedValue(5) }), { virtual: true });
    jest.mock('../../src/models/Facture', () => ({
      countDocuments: jest.fn().mockResolvedValue(10),
    }), { virtual: true });

    const UserMock = require('../../src/models/User');
    const OrderMock = require('../../src/models/Order');
    const ActivityLogMock = require('../../src/models/ActivityLog');
    const AuthLogMock = require('../../src/models/AuthLog');

    UserMock.countDocuments = jest.fn().mockResolvedValue(100);
    UserMock.aggregate = jest.fn().mockResolvedValue([{ _id: 'ARTISAN', count: 50 }]);

    OrderMock.countDocuments = jest.fn().mockResolvedValue(20);
    OrderMock.find = jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([{ lineTotal: 500 }]) });
    OrderMock.aggregate = jest.fn().mockResolvedValue([]);

    ActivityLogMock.aggregate = jest.fn().mockResolvedValue([]);
    AuthLogMock.aggregate = jest.fn().mockResolvedValue([]);

    global.fetch = jest.fn();

    ({ getAiInsights } = require('../../src/modules/admin/aiInsights.service'));
  });

  it('uses heuristic fallback when Ollama is unavailable', async () => {
    global.fetch.mockRejectedValue(new Error('Connection refused'));

    const result = await getAiInsights(30, true);
    expect(result.source).toBe('heuristic');
    expect(result.summary).toBeDefined();
    expect(Array.isArray(result.positives)).toBe(true);
    expect(Array.isArray(result.risks)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('uses heuristic fallback when Ollama returns non-ok response', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 503 });

    const result = await getAiInsights(30, true);
    expect(result.source).toBe('heuristic');
  });

  it('uses heuristic fallback when AI response has invalid shape', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ response: JSON.stringify({ summary: 'ok' }) }),
    });

    const result = await getAiInsights(30, true);
    expect(result.source).toBe('heuristic');
  });

  it('returns cached result on second call without forceRefresh', async () => {
    global.fetch.mockRejectedValue(new Error('fail'));

    const first = await getAiInsights(30, true);
    const second = await getAiInsights(30, false);
    expect(second.cached).toBe(true);
  });

  it('returns AI result when Ollama responds correctly', async () => {
    const aiReport = {
      summary: 'Platform is healthy',
      positives: ['Good growth'],
      risks: ['High cancellation'],
      recommendations: ['Improve onboarding'],
      score: 75,
    };
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ response: JSON.stringify(aiReport) }),
    });

    const result = await getAiInsights(30, true);
    expect(result.source).toBe('ai');
    expect(result.summary).toBe('Platform is healthy');
    expect(result.score).toBe(75);
  });

  it('clamps score to 0-100 range', async () => {
    const aiReport = {
      summary: 'ok',
      positives: ['p'],
      risks: ['r'],
      recommendations: ['rec'],
      score: 150,
    };
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ response: JSON.stringify(aiReport) }),
    });

    const result = await getAiInsights(30, true);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe('aiInsights.service – heuristicInsights logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    jest.mock('../../src/models/User');
    jest.mock('../../src/models/Order');
    jest.mock('../../src/models/ActivityLog');
    jest.mock('../../src/models/AuthLog');
    jest.mock('../../src/models/Subscription', () => ({ countDocuments: jest.fn().mockResolvedValue(0) }), { virtual: true });
    jest.mock('../../src/models/Facture', () => ({ countDocuments: jest.fn().mockResolvedValue(0) }), { virtual: true });

    const UserMock = require('../../src/models/User');
    const OrderMock = require('../../src/models/Order');
    const ActivityLogMock = require('../../src/models/ActivityLog');
    const AuthLogMock = require('../../src/models/AuthLog');

    UserMock.countDocuments = jest.fn().mockResolvedValue(200);
    UserMock.aggregate = jest.fn().mockResolvedValue([]);
    OrderMock.countDocuments = jest.fn().mockResolvedValue(50);
    OrderMock.find = jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([]) });
    // collectMetrics calls Order.aggregate twice:
    //   1st: orderStatusRaw  → [{ _id: 'DELIVERED', count: 40 }, ...]
    //   2nd: revenueRaw      → [{ _id: '2026-01-01', revenue: 500, orders: 5 }]
    OrderMock.aggregate = jest.fn()
      .mockResolvedValueOnce([{ _id: 'DELIVERED', count: 40 }, { _id: 'CANCELLED', count: 10 }])
      .mockResolvedValueOnce([{ _id: '2026-01-01', revenue: 500, orders: 5 }]);
    ActivityLogMock.aggregate = jest.fn().mockResolvedValue([]);
    AuthLogMock.aggregate = jest.fn().mockResolvedValue([]);

    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
  });

  it('adds risk for high block rate', async () => {
    const UserMock = require('../../src/models/User');
    // blocked = 20 out of 100 = 20% block rate
    UserMock.countDocuments
      .mockResolvedValueOnce(100)  // total
      .mockResolvedValueOnce(80)   // active
      .mockResolvedValueOnce(20)   // blocked
      .mockResolvedValue(0);

    const { getAiInsights } = require('../../src/modules/admin/aiInsights.service');
    const result = await getAiInsights(30, true);
    expect(result.risks.some(r => r.includes('blocage') || r.includes('bloqués'))).toBe(true);
  });
});
