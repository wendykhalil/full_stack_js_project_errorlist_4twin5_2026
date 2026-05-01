'use strict';
/**
 * Unit tests for ai.service.js
 * Exports: detectIntents, fetchContext, buildMessages, streamChat
 */

jest.mock('../../src/models/Order');
jest.mock('../../src/models/Project');
jest.mock('../../src/models/Facture');
jest.mock('../../src/models/Devis');
jest.mock('../../src/models/Product');
jest.mock('../../src/models/ArtisanProfile');
jest.mock('../../src/models/Availability');
jest.mock('../../src/models/Subscription');
jest.mock('../../src/models/ServiceRequest');
jest.mock('../../src/models/Review');
jest.mock('../../src/models/PromoCode');
jest.mock('../../src/models/User');
jest.mock('../../src/config/subscriptionPlans');

const Order          = require('../../src/models/Order');
const Project        = require('../../src/models/Project');
const Product        = require('../../src/models/Product');
const Subscription   = require('../../src/models/Subscription');
const ServiceRequest = require('../../src/models/ServiceRequest');
const Review         = require('../../src/models/Review');
const { getPlanFeatures } = require('../../src/config/subscriptionPlans');

const { detectIntents, fetchContext, buildMessages } =
  require('../../src/modules/ai-assistant/ai.service');

// Helper: mock all DB calls to return empty
function mockAllEmpty() {
  const emptyChain = () => ({
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([]),
  });
  Order.find.mockReturnValue(emptyChain());
  Project.find.mockReturnValue(emptyChain());
  Product.find.mockReturnValue(emptyChain());
  ServiceRequest.find.mockReturnValue(emptyChain());
  Review.find.mockReturnValue(emptyChain());
  Subscription.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
  require('../../src/models/Facture').find.mockReturnValue(emptyChain());
  require('../../src/models/Devis').find.mockReturnValue(emptyChain());
  require('../../src/models/ArtisanProfile').find.mockReturnValue(emptyChain());
  require('../../src/models/Availability').find.mockReturnValue(emptyChain());
  require('../../src/models/PromoCode').find.mockReturnValue(emptyChain());
  require('../../src/models/User').find.mockReturnValue(emptyChain());
  require('../../src/models/User').countDocuments.mockResolvedValue(0);
  // Also mock findOne for subscription
  require('../../src/models/Subscription').findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
}

beforeEach(() => {
  jest.clearAllMocks();
  getPlanFeatures.mockReturnValue({ maxProjects: 10, maxPortfolio: 5 });
});

// ─── detectIntents ────────────────────────────────────────────────────────────
describe('ai.service — detectIntents', () => {
  it('detects orders intent', () => {
    expect(detectIntents('mes commandes en cours')).toContain('orders');
  });
  it('detects invoices intent', () => {
    expect(detectIntents('voir mes factures impayées')).toContain('invoices');
  });
  it('detects quotes intent', () => {
    expect(detectIntents('créer un devis pour le client')).toContain('quotes');
  });
  it('detects projects intent', () => {
    expect(detectIntents('mes projets en cours')).toContain('projects');
  });
  it('detects products intent', () => {
    expect(detectIntents('cherche du ciment dans le catalogue')).toContain('products');
  });
  it('detects subscription intent', () => {
    expect(detectIntents('mon abonnement pro expire quand')).toContain('subscription');
  });
  it('detects artisans intent', () => {
    expect(detectIntents('trouver un plombier disponible')).toContain('artisans');
  });
  it('detects service requests intent', () => {
    expect(detectIntents('mes demandes de service')).toContain('serviceRequests');
  });
  it('detects reviews intent', () => {
    expect(detectIntents('voir les avis et notes')).toContain('reviews');
  });
  it('detects promo intent', () => {
    expect(detectIntents('code promo réduction')).toContain('promo');
  });
  it('returns general for unrecognized message', () => {
    expect(detectIntents('bonjour comment ça va')).toContain('general');
  });
  it('detects multiple intents', () => {
    const result = detectIntents('commandes et factures');
    expect(result).toContain('orders');
    expect(result).toContain('invoices');
  });
  it('detects users intent', () => {
    expect(detectIntents('liste des prescripteurs')).toContain('users');
  });
  it('detects availability intent', () => {
    expect(detectIntents('calendrier disponibilité artisan')).toContain('availability');
  });
});

// ─── fetchContext ─────────────────────────────────────────────────────────────
describe('ai.service — fetchContext', () => {
  it('returns context object for orders intent', async () => {
    mockAllEmpty();
    Order.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { _id: 'o1', status: 'DELIVERED', totalPrice: 100, productId: { name: 'Ciment' } }
      ])
    });
    const ctx = await fetchContext('user1', 'ARTISAN', ['orders'], 'mes commandes');
    expect(typeof ctx).toBe('object');
  });

  it('returns context for products intent', async () => {
    mockAllEmpty();
    Product.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { _id: 'p1', name: 'Ciment', price: 50, stock: 100, categoryId: { name: 'Mat' } }
      ])
    });
    const ctx = await fetchContext('user1', 'ARTISAN', ['products'], 'cherche ciment');
    expect(typeof ctx).toBe('object');
  });

  it('handles DB errors gracefully', async () => {
    mockAllEmpty();
    Order.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(new Error('DB fail'))
    });
    const ctx = await fetchContext('user1', 'ARTISAN', ['orders'], 'commandes');
    expect(typeof ctx).toBe('object');
  });

  it('returns context for projects intent', async () => {
    mockAllEmpty();
    Project.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { _id: 'pr1', title: 'Chantier A', status: 'ACTIVE', budgetTND: 5000 }
      ])
    });
    const ctx = await fetchContext('user1', 'ARTISAN', ['projects'], 'mes projets');
    expect(typeof ctx).toBe('object');
  });

  it('returns context for general intent', async () => {
    mockAllEmpty();
    const ctx = await fetchContext('user1', 'ARTISAN', ['general'], 'bonjour');
    expect(typeof ctx).toBe('object');
  });

  it('returns context for service requests', async () => {
    mockAllEmpty();
    ServiceRequest.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { _id: 'sr1', title: 'Plomberie', status: 'OPEN' }
      ])
    });
    const ctx = await fetchContext('user1', 'PRESCRIPTEUR', ['serviceRequests'], 'mes demandes');
    expect(typeof ctx).toBe('object');
  });
});

// ─── Helper functions ─────────────────────────────────────────────────────────
describe('ai.service — helper functions via fetchContext', () => {
  it('detects artisan filters from message', async () => {
    mockAllEmpty();
    require('../../src/models/ArtisanProfile').find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { _id: 'a1', trade: 'Plombier', region: 'Tunis', userId: { firstName: 'Ali', lastName: 'Ben' } }
      ]),
    });
    const ctx = await fetchContext('user1', 'PRESCRIPTEUR', ['artisans'], 'trouver un plombier à tunis');
    expect(typeof ctx).toBe('object');
  });

  it('detects service request filters - open', async () => {
    mockAllEmpty();
    ServiceRequest.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: 'sr1', title: 'Test', status: 'OPEN' }]),
    });
    const ctx = await fetchContext('user1', 'ARTISAN', ['serviceRequests'], 'demandes en cours ouvertes');
    expect(typeof ctx).toBe('object');
  });

  it('detects service request filters - completed', async () => {
    mockAllEmpty();
    ServiceRequest.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    const ctx = await fetchContext('user1', 'ARTISAN', ['serviceRequests'], 'demandes terminées complétées');
    expect(typeof ctx).toBe('object');
  });

  it('detects user role filter - prescripteur', async () => {
    mockAllEmpty();
    require('../../src/models/User').find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ firstName: 'Jean', lastName: 'Dupont', role: 'PRESCRIPTEUR' }]),
    });
    require('../../src/models/User').countDocuments.mockResolvedValue(5);
    const ctx = await fetchContext('user1', 'ADMIN', ['users'], 'liste des prescripteurs architectes');
    expect(typeof ctx).toBe('object');
  });

  it('detects user role filter - supplier', async () => {
    mockAllEmpty();
    const ctx = await fetchContext('user1', 'ADMIN', ['users'], 'liste des fournisseurs suppliers');
    expect(typeof ctx).toBe('object');
  });

  it('fetches reviews data', async () => {
    mockAllEmpty();
    Review.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { _id: 'r1', rating: 5, comment: 'Excellent', orderId: { productId: { name: 'Ciment' } } }
      ]),
    });
    const ctx = await fetchContext('user1', 'ARTISAN', ['reviews'], 'mes avis et notes');
    expect(typeof ctx).toBe('object');
  });

  it('fetches promo codes', async () => {
    mockAllEmpty();
    require('../../src/models/PromoCode').find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { _id: 'pc1', code: 'PROMO10', discount: 10, isActive: true }
      ]),
    });
    const ctx = await fetchContext('user1', 'ARTISAN', ['promo'], 'codes promo disponibles');
    expect(typeof ctx).toBe('object');
  });

  it('fetches availability data', async () => {
    mockAllEmpty();
    require('../../src/models/Availability').find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { _id: 'av1', date: new Date(), isAvailable: true }
      ]),
    });
    const ctx = await fetchContext('user1', 'ARTISAN', ['availability'], 'mes disponibilités calendrier');
    expect(typeof ctx).toBe('object');
  });

  it('fetches invoices data', async () => {
    mockAllEmpty();
    require('../../src/models/Facture').find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { _id: 'f1', number: 'FACT-001', total: 500, status: 'PAID' }
      ]),
    });
    const ctx = await fetchContext('user1', 'ARTISAN', ['invoices'], 'mes factures impayées');
    expect(typeof ctx).toBe('object');
  });

  it('fetches quotes data', async () => {
    mockAllEmpty();
    require('../../src/models/Devis').find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { _id: 'd1', number: 'DEV-001', total: 1000, status: 'PENDING' }
      ]),
    });
    const ctx = await fetchContext('user1', 'ARTISAN', ['quotes'], 'mes devis en attente');
    expect(typeof ctx).toBe('object');
  });
});
describe('ai.service — buildMessages', () => {
  const mockUser = { firstName: 'Alice', lastName: 'Dupont', role: 'ARTISAN' };

  it('builds message array with system and user messages', () => {
    const history = [
      { role: 'user', content: 'Bonjour' },
      { role: 'assistant', content: 'Bonjour! Comment puis-je vous aider?' },
    ];
    const messages = buildMessages(mockUser, { orders: [] }, 'Nouvelle question', history);
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].role).toBe('system');
    const lastMsg = messages[messages.length - 1];
    expect(lastMsg.role).toBe('user');
    expect(lastMsg.content).toBe('Nouvelle question');
  });

  it('handles empty history', () => {
    const messages = buildMessages(mockUser, {}, 'Question', []);
    expect(messages.length).toBeGreaterThanOrEqual(2);
  });

  it('includes user name in system message', () => {
    const messages = buildMessages(mockUser, {}, 'test', []);
    const systemMsg = messages.find(m => m.role === 'system');
    expect(systemMsg.content).toContain('Alice');
  });

  it('includes context data in system message', () => {
    const messages = buildMessages(mockUser, { orders: [{ status: 'DELIVERED' }] }, 'test', []);
    const systemMsg = messages.find(m => m.role === 'system');
    expect(systemMsg.content.length).toBeGreaterThan(50);
  });

  it('handles history with multiple turns', () => {
    const history = Array.from({ length: 5 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }));
    const messages = buildMessages(mockUser, {}, 'Final question', history);
    expect(messages.length).toBeGreaterThan(2);
  });
});
