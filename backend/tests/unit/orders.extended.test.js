'use strict';
/**
 * Extended unit tests for orders.controller.js
 * Mocks ordersService to test controller logic cleanly
 */

jest.mock('../../src/modules/orders/orders.service');
jest.mock('../../src/utils/notify');
jest.mock('../../src/utils/apiResponse', () => (res, msg, data, status = 200) => {
  res.status(status).json({ message: msg, data });
});

const httpMocks = require('node-mocks-http');
const ordersService = require('../../src/modules/orders/orders.service');
const { notify } = require('../../src/utils/notify');

const ctrl = require('../../src/modules/orders/orders.controller');

function req(overrides = {}) {
  return httpMocks.createRequest({
    user: { _id: 'user123', id: 'user123', role: 'ARTISAN' },
    params: {},
    body: {},
    query: {},
    ...overrides,
  });
}
function res() { return httpMocks.createResponse(); }
const next = jest.fn();

beforeEach(() => jest.clearAllMocks());

// ─── createOrder ─────────────────────────────────────────────────────────────
describe('orders.createOrder', () => {
  it('creates order and returns 201', async () => {
    const order = { _id: 'o1', orderNumber: 'ORD-001' };
    ordersService.createOrder.mockResolvedValue(order);
    const r = res();
    await ctrl.createOrder(req({ body: { productId: 'p1', quantity: 2 } }), r, next);
    expect(r.statusCode).toBe(201);
    expect(r._getJSONData().data).toEqual(order);
  });

  it('returns 400 on service error', async () => {
    ordersService.createOrder.mockRejectedValue(Object.assign(new Error('Out of stock'), { statusCode: 400 }));
    const r = res();
    await ctrl.createOrder(req({ body: { productId: 'p1', quantity: 1 } }), r, next);
    expect(r.statusCode).toBe(400);
  });

  it('returns 500 on unexpected error', async () => {
    ordersService.createOrder.mockRejectedValue(new Error('DB crash'));
    const r = res();
    await ctrl.createOrder(req({ body: { productId: 'p1', quantity: 1 } }), r, next);
    expect(r.statusCode).toBe(500);
  });
});

// ─── getMyOrders ─────────────────────────────────────────────────────────────
describe('orders.getMyOrders', () => {
  it('returns orders', async () => {
    ordersService.getOrdersByArtisan.mockResolvedValue({ orders: [{ _id: 'o1' }], total: 1 });
    const r = res();
    await ctrl.getMyOrders(req({ query: { page: '1', limit: '10' } }), r, next);
    expect(r.statusCode).toBe(200);
  });

  it('returns 500 on error', async () => {
    ordersService.getOrdersByArtisan.mockRejectedValue(new Error('fail'));
    const r = res();
    await ctrl.getMyOrders(req(), r, next);
    expect(r.statusCode).toBe(500);
  });
});

// ─── getSupplierOrders ────────────────────────────────────────────────────────
describe('orders.getSupplierOrders', () => {
  it('returns supplier orders', async () => {
    ordersService.getOrdersBySupplier.mockResolvedValue({ orders: [], total: 0 });
    const r = res();
    await ctrl.getSupplierOrders(req({ user: { _id: 'sup1', role: 'SUPPLIER' } }), r, next);
    expect(r.statusCode).toBe(200);
  });
});

// ─── updateOrderStatus ────────────────────────────────────────────────────────
describe('orders.updateOrderStatus', () => {
  it('updates status successfully', async () => {
    const order = { _id: 'o1', status: 'ACCEPTED' };
    ordersService.updateOrderStatus.mockResolvedValue(order);
    notify.mockResolvedValue(true);
    const r = res();
    await ctrl.updateOrderStatus(
      req({ user: { _id: 'sup1', role: 'SUPPLIER' }, params: { id: 'o1' }, body: { status: 'ACCEPTED' } }),
      r, next
    );
    expect(r.statusCode).toBe(200);
  });

  it('returns error status on failure', async () => {
    ordersService.updateOrderStatus.mockRejectedValue(Object.assign(new Error('Not found'), { statusCode: 404 }));
    const r = res();
    await ctrl.updateOrderStatus(
      req({ params: { id: 'o1' }, body: { status: 'ACCEPTED' } }),
      r, next
    );
    expect(r.statusCode).toBe(404);
  });
});

// ─── addSupplierNote ──────────────────────────────────────────────────────────
describe('orders.addSupplierNote', () => {
  it('adds note successfully', async () => {
    const order = { _id: 'o1', supplierNote: 'Ready' };
    ordersService.addSupplierNote.mockResolvedValue(order);
    const r = res();
    await ctrl.addSupplierNote(
      req({ user: { _id: 'sup1', role: 'SUPPLIER' }, params: { id: 'o1' }, body: { note: 'Ready' } }),
      r, next
    );
    expect(r.statusCode).toBe(200);
  });

  it('returns error on failure', async () => {
    ordersService.addSupplierNote.mockRejectedValue(Object.assign(new Error('Not found'), { statusCode: 404 }));
    const r = res();
    await ctrl.addSupplierNote(req({ params: { id: 'o1' }, body: { note: 'x' } }), r, next);
    expect(r.statusCode).toBe(404);
  });
});

// ─── getOrderById ─────────────────────────────────────────────────────────────
describe('orders.getOrderById', () => {
  it('returns order', async () => {
    const order = { _id: 'o1', artisanId: 'user123' };
    ordersService.getOrderById.mockResolvedValue(order);
    const r = res();
    await ctrl.getOrderById(req({ params: { id: 'o1' } }), r, next);
    expect(r.statusCode).toBe(200);
  });

  it('returns 404 if not found', async () => {
    ordersService.getOrderById.mockRejectedValue(Object.assign(new Error('Not found'), { statusCode: 404 }));
    const r = res();
    await ctrl.getOrderById(req({ params: { id: 'bad' } }), r, next);
    expect(r.statusCode).toBe(404);
  });
});

// ─── getArtisanActiveOrders ───────────────────────────────────────────────────
describe('orders.getArtisanActiveOrders', () => {
  it('returns active orders', async () => {
    ordersService.getArtisanActiveOrders.mockResolvedValue({ orders: [], total: 0 });
    const r = res();
    await ctrl.getArtisanActiveOrders(req(), r, next);
    expect(r.statusCode).toBe(200);
  });
});

// ─── getArtisanOrderHistory ───────────────────────────────────────────────────
describe('orders.getArtisanOrderHistory', () => {
  it('returns order history', async () => {
    ordersService.getArtisanOrderHistory.mockResolvedValue({ orders: [], total: 0 });
    const r = res();
    await ctrl.getArtisanOrderHistory(req(), r, next);
    expect(r.statusCode).toBe(200);
  });
});

// ─── submitReview ─────────────────────────────────────────────────────────────
describe('orders.submitReview', () => {
  it('submits review successfully', async () => {
    ordersService.submitReview.mockResolvedValue({ ok: true });
    const r = res();
    await ctrl.submitReview(req({ params: { id: 'o1' }, body: { rating: 5, comment: 'Great!' } }), r, next);
    expect(r.statusCode).toBe(200);
  });

  it('returns error on failure', async () => {
    ordersService.submitReview.mockRejectedValue(Object.assign(new Error('Already reviewed'), { statusCode: 400 }));
    const r = res();
    await ctrl.submitReview(req({ params: { id: 'o1' }, body: { rating: 5 } }), r, next);
    expect(r.statusCode).toBe(400);
  });
});
