'use strict';

jest.mock('../../src/models/User');
jest.mock('../../src/models/Order');
jest.mock('../../src/models/ActivityLog');
jest.mock('../../src/models/AuthLog');
jest.mock('../../src/models/Subscription');
jest.mock('../../src/models/Facture');

// Mock fetch BEFORE requiring the service
const mockFetch = jest.fn();
global.fetch = mockFetch;

const User = require('../../src/models/User');
const Order = require('../../src/models/Order');
const ActivityLog = require('../../src/models/ActivityLog');
const AuthLog = require('../../src/models/AuthLog');
const Subscription = require('../../src/models/Subscription');
const Facture = require('../../src/models/Facture');

// Require service ONCE — no resetModules
const { getAiInsights } = require('../../src/modules/admin/aiInsights.service');

function setupDefaultMocks() {
  User.countDocuments.mockResolvedValue(100);
  User.aggregate.mockResolvedValue([{ _id: 'ARTISAN', count: 50 }]);
  Order.countDocuments.mockResolvedValue(20);
  Order.find.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([{ lineTotal: 500 }]),
  });
  Order.aggregate.mockResolvedValue([]);
  ActivityLog.aggregate.mockResolvedValue([]);
  AuthLog.aggregate.mockResolvedValue([]);
  Subscription.countDocuments.mockResolvedValue(5);
  Facture.countDocuments.mockResolvedValue(10);
  // Default: Ollama unavailable
  mockFetch.mockRejectedValue(new Error('Connection refused'));
}

beforeEach(() => {
  jest.clearAllMocks();
  setupDefaultMocks();
});

describe('aiInsights.service — getAiInsights', () => {
  it('uses heuristic fallback when Ollama is unavailable', async () => {
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
    mockFetch.mockResolvedValue({ ok: false, status: 503 });
    const result = await getAiInsights(30, true);
    expect(result.source).toBe('heuristic');
  });

  it('uses heuristic fallback when AI response has invalid shape', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ response: JSON.stringify({ summary: 'ok' }) }),
    });
    const result = await getAiInsights(30, true);
    expect(result.source).toBe('heuristic');
  });

  it('returns cached result on second call without forceRefresh', async () => {
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
    mockFetch.mockResolvedValue({
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
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ response: JSON.stringify(aiReport) }),
    });
    const result = await getAiInsights(30, true);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe('aiInsights.service — heuristicInsights logic', () => {
  it('adds risk for high block rate', async () => {
    // blocked = 20 out of 100 = 20% block rate
    User.countDocuments
      .mockResolvedValueOnce(100)  // total
      .mockResolvedValueOnce(80)   // active
      .mockResolvedValueOnce(20)   // blocked
      .mockResolvedValue(0);

    const result = await getAiInsights(30, true);
    expect(result.risks.some(r => r.includes('blocage') || r.includes('bloqués'))).toBe(true);
  });
});
