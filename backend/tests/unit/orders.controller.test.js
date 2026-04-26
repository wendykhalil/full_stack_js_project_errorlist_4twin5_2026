'use strict';

// orders.service.js has a duplicate addSupplierNote declaration (source bug).
// We mock the entire module to bypass the parse error and test the controller.
jest.mock('../../src/modules/orders/orders.service', () => ({
  createOrder: jest.fn(),
  getOrdersByArtisan: jest.fn(),
  getOrdersBySupplier: jest.fn(),
  updateOrderStatus: jest.fn(),
  addSupplierNote: jest.fn(),
  getOrderById: jest.fn(),
  getArtisanActiveOrders: jest.fn(),
  getArtisanOrderHistory: jest.fn(),
  getSupplierActiveOrders: jest.fn(),
  getSupplierOrderHistory: jest.fn(),
  submitReview: jest.fn(),
}));
jest.mock('../../src/utils/apiResponse');
jest.mock('../../src/utils/notify', () => ({ notify: jest.fn().mockResolvedValue(true) }));

const ordersService = require('../../src/modules/orders/orders.service');
const apiResponse = require('../../src/utils/apiResponse');
const {
  createOrder,
  getMyOrders,
  getSupplierOrders,
  updateOrderStatus,
  addSupplierNote,
  getOrderById,
  getArtisanActiveOrders,
  getArtisanOrderHistory,
  getSupplierActiveOrders,
  getSupplierOrderHistory,
  submitReview,
} = require('../../src/modules/orders/orders.controller');

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

describe('orders.controller – createOrder', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates order and returns 201', async () => {
    const mockOrder = { _id: 'order1', orderNumber: 'CMD-001' };
    ordersService.createOrder.mockResolvedValue(mockOrder);
    const req = makeReq({ body: { productId: 'p1', quantity: 2 } });
    const res = makeRes();
    await createOrder(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Demande de commande créée avec succès', mockOrder, 201);
  });

  it('returns 500 on service error', async () => {
    const err = new Error('DB fail');
    ordersService.createOrder.mockRejectedValue(err);
    const req = makeReq();
    const res = makeRes();
    await createOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('uses statusCode from error when available', async () => {
    const err = new Error('Not found');
    err.statusCode = 404;
    ordersService.createOrder.mockRejectedValue(err);
    const req = makeReq();
    const res = makeRes();
    await createOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('orders.controller – getMyOrders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns orders on success', async () => {
    ordersService.getOrdersByArtisan.mockResolvedValue({ orders: [], pagination: {} });
    const req = makeReq({ query: { page: '1', limit: '10' } });
    const res = makeRes();
    await getMyOrders(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Commandes récupérées', { orders: [], pagination: {} });
  });

  it('splits status query param', async () => {
    ordersService.getOrdersByArtisan.mockResolvedValue({ orders: [], pagination: {} });
    const req = makeReq({ query: { status: 'PENDING,ACCEPTED' } });
    const res = makeRes();
    await getMyOrders(req, res);
    expect(ordersService.getOrdersByArtisan).toHaveBeenCalledWith(
      'user1',
      expect.objectContaining({ status: ['PENDING', 'ACCEPTED'] })
    );
  });
});

describe('orders.controller – updateOrderStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates status and notifies artisan', async () => {
    const mockOrder = { _id: 'order1', orderNumber: 'CMD-001', artisanId: 'artisan1' };
    ordersService.updateOrderStatus.mockResolvedValue(mockOrder);
    const req = makeReq({ params: { id: 'order1' }, body: { status: 'ACCEPTED', note: '' } });
    const res = makeRes();
    await updateOrderStatus(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Statut de la commande mis à jour', mockOrder);
  });

  it('returns 500 on error', async () => {
    ordersService.updateOrderStatus.mockRejectedValue(new Error('fail'));
    const req = makeReq({ params: { id: 'order1' }, body: { status: 'ACCEPTED' } });
    const res = makeRes();
    await updateOrderStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('orders.controller – addSupplierNote', () => {
  beforeEach(() => jest.clearAllMocks());

  it('adds note and returns order', async () => {
    const mockOrder = { _id: 'order1', supplierNotes: 'Note here' };
    ordersService.addSupplierNote.mockResolvedValue(mockOrder);
    const req = makeReq({ params: { id: 'order1' }, body: { note: 'Note here' } });
    const res = makeRes();
    await addSupplierNote(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Note ajoutée', mockOrder);
  });
});

describe('orders.controller – getOrderById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns order on success', async () => {
    const mockOrder = { _id: 'order1' };
    ordersService.getOrderById.mockResolvedValue(mockOrder);
    const req = makeReq({ params: { id: 'order1' } });
    const res = makeRes();
    await getOrderById(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Commande récupérée', mockOrder);
  });

  it('returns 403 on unauthorized error', async () => {
    const err = new Error('Non autorisé');
    err.statusCode = 403;
    ordersService.getOrderById.mockRejectedValue(err);
    const req = makeReq({ params: { id: 'order1' } });
    const res = makeRes();
    await getOrderById(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('orders.controller – submitReview', () => {
  beforeEach(() => jest.clearAllMocks());

  it('submits review and returns 200', async () => {
    const mockOrder = { _id: 'order1', review: { rating: 4 } };
    ordersService.submitReview.mockResolvedValue(mockOrder);
    const req = makeReq({ params: { id: 'order1' }, body: { rating: 4, comment: 'Good' } });
    const res = makeRes();
    await submitReview(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Avis enregistré avec succès', mockOrder);
  });

  it('returns error status on failure', async () => {
    const err = new Error('Already reviewed');
    err.statusCode = 409;
    ordersService.submitReview.mockRejectedValue(err);
    const req = makeReq({ params: { id: 'order1' }, body: { rating: 4 } });
    const res = makeRes();
    await submitReview(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe('orders.controller – getArtisanActiveOrders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns active orders', async () => {
    ordersService.getArtisanActiveOrders.mockResolvedValue({ orders: [], pagination: {} });
    const req = makeReq({ query: {} });
    const res = makeRes();
    await getArtisanActiveOrders(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Commandes en cours récupérées', { orders: [], pagination: {} });
  });
});

describe('orders.controller – getSupplierOrders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns supplier orders', async () => {
    ordersService.getOrdersBySupplier.mockResolvedValue({ orders: [], pagination: {} });
    const req = makeReq({ query: {} });
    const res = makeRes();
    await getSupplierOrders(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Commandes fournisseur récupérées', { orders: [], pagination: {} });
  });
});
