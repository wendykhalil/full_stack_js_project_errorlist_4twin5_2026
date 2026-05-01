'use strict';
/**
 * Extended tests for orders.service.js
 */

jest.mock('../../src/models/Order');
jest.mock('../../src/models/Product');
jest.mock('../../src/models/User');
jest.mock('../../src/utils/notify');
jest.mock('../../src/utils/orderEmail');
jest.mock('../../src/socket', () => ({ notifySupplierNewOrder: jest.fn() }));

const Order   = require('../../src/models/Order');
const Product = require('../../src/models/Product');
const User    = require('../../src/models/User');
const { notify } = require('../../src/utils/notify');
const { sendNewOrderEmailToSupplier } = require('../../src/utils/orderEmail');

const ordersService = require('../../src/modules/orders/orders.service');

function makeOrder(overrides = {}) {
  return {
    _id: 'o1',
    orderNumber: 'CMD-2601-0001',
    artisanId: 'artisan1',
    supplierId: 'supplier1',
    productId: 'p1',
    quantity: 2,
    status: 'PENDING',
    statusHistory: [],
    supplierNotes: '',
    save: jest.fn().mockResolvedValue(true),
    populate: jest.fn().mockResolvedValue(true),
    toString: () => 'o1',
    ...overrides,
  };
}

// Returns a chainable mock for Order.findById().populate().populate()...
function makeOrderFindChain(returnValue) {
  const chain = {
    populate: jest.fn(),
    lean: jest.fn().mockResolvedValue(returnValue),
    then: (resolve) => Promise.resolve(returnValue).then(resolve),
    catch: (reject) => Promise.resolve(returnValue).catch(reject),
  };
  chain.populate.mockReturnValue(chain);
  return chain;
}

beforeEach(() => jest.clearAllMocks());

// ─── createOrder ─────────────────────────────────────────────────────────────
describe('ordersService.createOrder', () => {
  it('throws 404 if product not found', async () => {
    Product.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    await expect(ordersService.createOrder({ productId: 'p1', quantity: 1, artisanId: 'a1' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 if insufficient stock', async () => {
    Product.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ _id: 'p1', stock: 1, price: 10, supplierId: { _id: 's1' } })
    });
    await expect(ordersService.createOrder({ productId: 'p1', quantity: 5, artisanId: 'a1' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 404 if artisan not found', async () => {
    Product.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ _id: 'p1', stock: 10, price: 10, supplierId: { _id: 's1' } })
    });
    User.findById.mockResolvedValue(null);
    await expect(ordersService.createOrder({ productId: 'p1', quantity: 1, artisanId: 'a1' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('creates order successfully', async () => {
    const product = {
      _id: 'p1', stock: 10, price: 50, name: 'Ciment',
      supplierId: { _id: 's1', email: 'sup@test.com', firstName: 'Sup', lastName: 'Plier' }
    };
    Product.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(product) });
    User.findById.mockResolvedValue({ _id: 'a1', firstName: 'Art', lastName: 'Isan', email: 'art@test.com' });
    const savedOrder = makeOrder();
    Order.mockImplementation(() => savedOrder);
    Product.findByIdAndUpdate.mockResolvedValue(true);
    notify.mockResolvedValue(true);
    sendNewOrderEmailToSupplier.mockResolvedValue(true);

    await ordersService.createOrder({ productId: 'p1', quantity: 2, artisanId: 'a1', deliveryAddress: '123 rue' });
    expect(savedOrder.save).toHaveBeenCalled();
  });
});

// ─── getOrdersByArtisan ───────────────────────────────────────────────────────
describe('ordersService.getOrdersByArtisan', () => {
  it('returns paginated orders for artisan', async () => {
    Order.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([makeOrder()]),
    });
    Order.countDocuments.mockResolvedValue(1);
    const result = await ordersService.getOrdersByArtisan('a1', { page: 1, limit: 10, status: [] });
    expect(result.orders).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it('filters by status', async () => {
    Order.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    Order.countDocuments.mockResolvedValue(0);
    const result = await ordersService.getOrdersByArtisan('a1', { page: 1, limit: 10, status: ['DELIVERED'] });
    expect(result.orders).toHaveLength(0);
  });
});

// ─── getOrdersBySupplier ──────────────────────────────────────────────────────
describe('ordersService.getOrdersBySupplier', () => {
  it('returns paginated orders for supplier', async () => {
    Order.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([makeOrder()]),
    });
    Order.countDocuments.mockResolvedValue(1);
    const result = await ordersService.getOrdersBySupplier('s1', { page: 1, limit: 10, status: [] });
    expect(result.orders).toHaveLength(1);
  });
});

// ─── updateOrderStatus ────────────────────────────────────────────────────────
describe('ordersService.updateOrderStatus', () => {
  it('throws 404 if order not found', async () => {
    Order.findById.mockReturnValue(makeOrderFindChain(null));
    await expect(ordersService.updateOrderStatus('o1', 'u1', 'ACCEPTED'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 if user not authorized', async () => {
    const order = makeOrder({
      supplierId: { _id: { toString: () => 'other' }, toString: () => 'other' },
      artisanId: { _id: { toString: () => 'other2' }, toString: () => 'other2' }
    });
    Order.findById.mockReturnValue(makeOrderFindChain(order));
    await expect(ordersService.updateOrderStatus('o1', 'intruder', 'ACCEPTED'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('updates status successfully as supplier', async () => {
    const order = makeOrder({
      supplierId: { _id: { toString: () => 'supplier1' }, toString: () => 'supplier1', email: 's@test.com', firstName: 'S', lastName: 'P' },
      artisanId: { _id: { toString: () => 'artisan1' }, toString: () => 'artisan1', email: 'a@test.com', firstName: 'A', lastName: 'I' },
    });
    Order.findById.mockReturnValue(makeOrderFindChain(order));
    Order.updateOne.mockResolvedValue({ modifiedCount: 1 });
    Order.findById.mockReturnValueOnce(makeOrderFindChain(order));
    notify.mockResolvedValue(true);
    // Should not throw
    await expect(ordersService.updateOrderStatus('o1', 'supplier1', 'ACCEPTED', 'note')).resolves.toBeDefined();
  });
});

// ─── addSupplierNote ──────────────────────────────────────────────────────────
describe('ordersService.addSupplierNote', () => {
  it('throws 404 if order not found', async () => {
    Order.findById.mockResolvedValue(null);
    await expect(ordersService.addSupplierNote('o1', 's1', 'note'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 if not supplier', async () => {
    const order = makeOrder({ supplierId: { toString: () => 'other' } });
    Order.findById.mockResolvedValue(order);
    await expect(ordersService.addSupplierNote('o1', 'intruder', 'note'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('adds note successfully', async () => {
    const order = makeOrder({ supplierId: { toString: () => 'supplier1' } });
    Order.findById.mockResolvedValue(order);
    await ordersService.addSupplierNote('o1', 'supplier1', 'Ready to ship');
    expect(order.save).toHaveBeenCalled();
    expect(order.supplierNotes).toBe('Ready to ship');
  });
});

// ─── getOrderById ─────────────────────────────────────────────────────────────
describe('ordersService.getOrderById', () => {
  it('throws 404 if order not found', async () => {
    Order.findById.mockReturnValue(makeOrderFindChain(null));
    await expect(ordersService.getOrderById('bad', 'u1'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns order when found and authorized', async () => {
    const order = makeOrder({
      artisanId: { toString: () => 'user1', _id: 'user1' },
      supplierId: { toString: () => 'supplier1', _id: 'supplier1' },
    });
    Order.findById.mockReturnValue(makeOrderFindChain(order));
    const result = await ordersService.getOrderById('o1', 'user1');
    expect(result).toBeDefined();
  });
});

// ─── getArtisanActiveOrders ───────────────────────────────────────────────────
describe('ordersService.getArtisanActiveOrders', () => {
  it('returns active orders', async () => {
    Order.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([makeOrder()]),
    });
    Order.countDocuments.mockResolvedValue(1);
    const result = await ordersService.getArtisanActiveOrders('a1', { page: 1, limit: 10 });
    expect(result.orders).toHaveLength(1);
  });
});

// ─── getArtisanOrderHistory ───────────────────────────────────────────────────
describe('ordersService.getArtisanOrderHistory', () => {
  it('returns order history', async () => {
    Order.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    Order.countDocuments.mockResolvedValue(0);
    const result = await ordersService.getArtisanOrderHistory('a1', { page: 1, limit: 10 });
    expect(result.orders).toHaveLength(0);
  });
});

// ─── getSupplierActiveOrders ──────────────────────────────────────────────────
describe('ordersService.getSupplierActiveOrders', () => {
  it('returns active supplier orders', async () => {
    Order.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([makeOrder()]),
    });
    Order.countDocuments.mockResolvedValue(1);
    const result = await ordersService.getSupplierActiveOrders('s1', { page: 1, limit: 10 });
    expect(result.orders).toHaveLength(1);
  });
});

// ─── getSupplierOrderHistory ──────────────────────────────────────────────────
describe('ordersService.getSupplierOrderHistory', () => {
  it('returns supplier order history', async () => {
    Order.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    Order.countDocuments.mockResolvedValue(0);
    const result = await ordersService.getSupplierOrderHistory('s1', { page: 1, limit: 10 });
    expect(result.orders).toHaveLength(0);
  });
});
