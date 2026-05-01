'use strict';
jest.mock('../../src/modules/orders/orders.service');
jest.mock('../../src/utils/notify');
jest.mock('../../src/utils/apiResponse', () => (res, msg, data, status = 200) => {
  res.status(status).json({ message: msg, data });
});

const httpMocks = require('node-mocks-http');
const ordersService = require('../../src/modules/orders/orders.service');
const ctrl = require('../../src/modules/orders/orders.controller');

function req(overrides = {}) {
  return httpMocks.createRequest({
    user: { _id: 'user1', role: 'ARTISAN' },
    params: {}, body: {}, query: {},
    ...overrides,
  });
}
function res() { return httpMocks.createResponse(); }

beforeEach(() => jest.clearAllMocks());

describe('orders.controller — getArtisanActiveOrders', () => {
  it('returns active orders', async () => {
    ordersService.getArtisanActiveOrders.mockResolvedValue({ orders: [], pagination: { total: 0 } });
    const r = res();
    await ctrl.getArtisanActiveOrders(req({ query: { page: '1', limit: '10' } }), r);
    expect(r.statusCode).toBe(200);
  });
  it('returns error on failure', async () => {
    ordersService.getArtisanActiveOrders.mockRejectedValue(Object.assign(new Error('fail'), { statusCode: 500 }));
    const r = res();
    await ctrl.getArtisanActiveOrders(req(), r);
    expect(r.statusCode).toBe(500);
  });
});

describe('orders.controller — getArtisanOrderHistory', () => {
  it('returns order history', async () => {
    ordersService.getArtisanOrderHistory.mockResolvedValue({ orders: [], pagination: { total: 0 } });
    const r = res();
    await ctrl.getArtisanOrderHistory(req(), r);
    expect(r.statusCode).toBe(200);
  });
});

describe('orders.controller — getSupplierActiveOrders', () => {
  it('returns active supplier orders', async () => {
    ordersService.getSupplierActiveOrders.mockResolvedValue({ orders: [], pagination: { total: 0 } });
    const r = res();
    await ctrl.getSupplierActiveOrders(req({ user: { _id: 's1', role: 'SUPPLIER' } }), r);
    expect(r.statusCode).toBe(200);
  });
});

describe('orders.controller — getSupplierOrderHistory', () => {
  it('returns supplier order history', async () => {
    ordersService.getSupplierOrderHistory.mockResolvedValue({ orders: [], pagination: { total: 0 } });
    const r = res();
    await ctrl.getSupplierOrderHistory(req({ user: { _id: 's1', role: 'SUPPLIER' } }), r);
    expect(r.statusCode).toBe(200);
  });
});

describe('orders.controller — submitReview', () => {
  it('submits review', async () => {
    ordersService.submitReview.mockResolvedValue({ ok: true });
    const r = res();
    await ctrl.submitReview(req({ params: { id: 'o1' }, body: { rating: 5, comment: 'Great' } }), r);
    expect(r.statusCode).toBe(200);
  });
  it('returns error on failure', async () => {
    ordersService.submitReview.mockRejectedValue(Object.assign(new Error('Already reviewed'), { statusCode: 400 }));
    const r = res();
    await ctrl.submitReview(req({ params: { id: 'o1' }, body: { rating: 5 } }), r);
    expect(r.statusCode).toBe(400);
  });
});
