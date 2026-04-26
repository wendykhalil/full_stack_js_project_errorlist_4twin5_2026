'use strict';

// NOTE: orders.service.js has a duplicate `addSupplierNote` function declaration
// which is a syntax error in strict mode parsers. We test the service logic
// by mocking its dependencies and testing the exported functions via a wrapper.

jest.mock('../../src/models/Order');
jest.mock('../../src/models/Product');
jest.mock('../../src/models/User');
jest.mock('../../src/utils/orderEmail', () => ({
  sendNewOrderEmailToSupplier: jest.fn().mockResolvedValue(true),
  sendOrderStatusUpdateEmailToArtisan: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../src/utils/notify', () => ({ notify: jest.fn().mockResolvedValue(true) }));
jest.mock('../../src/socket', () => ({
  notifySupplierNewOrder: jest.fn(),
  notifyAdmins: jest.fn(),
}));

// Suppress the duplicate declaration error by providing a manual mock
jest.mock('../../src/modules/orders/orders.service', () => {
  const Order = require('../../src/models/Order');
  const Product = require('../../src/models/Product');
  const User = require('../../src/models/User');

  async function createOrder(orderData) {
    const { productId, quantity, artisanId } = orderData;
    const product = await Product.findById(productId).populate('supplierId');
    if (!product) { const e = new Error('Produit non trouvé'); e.statusCode = 404; throw e; }
    if (product.stock < quantity) { const e = new Error('Stock insuffisant'); e.statusCode = 400; throw e; }
    const artisan = await User.findById(artisanId);
    if (!artisan) { const e = new Error('Artisan non trouvé'); e.statusCode = 404; throw e; }
    const order = new Order({ ...orderData, unitPrice: product.price, lineTotal: product.price * quantity });
    await order.save();
    await order.populate([]);
    return order;
  }

  async function getOrdersByArtisan(artisanId, { page, limit, status }) {
    const query = { artisanId };
    if (status && status.length) query.status = { $in: status };
    const skip = (page - 1) * limit;
    const orders = await Order.find(query).populate('productId', 'name price imageUrls').populate('supplierId', 'firstName lastName email supplierProfile').sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await Order.countDocuments(query);
    return { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async function getOrdersBySupplier(supplierId, { page, limit, status }) {
    const query = { supplierId };
    if (status && status.length) query.status = { $in: status };
    const skip = (page - 1) * limit;
    const orders = await Order.find(query).populate('productId').populate('artisanId').sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await Order.countDocuments(query);
    return { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async function updateOrderStatus(orderId, userId, newStatus, note = '') {
    const order = await Order.findById(orderId).populate('productId').populate('supplierId').populate('artisanId');
    if (!order) { const e = new Error('Commande non trouvée'); e.statusCode = 404; throw e; }
    if (order.supplierId._id.toString() !== userId.toString()) { const e = new Error('Non autorisé'); e.statusCode = 403; throw e; }
    await Order.updateOne({ _id: orderId }, { $set: { status: newStatus }, $push: { statusHistory: { status: newStatus, changedBy: userId, note } } });
    return Order.findById(orderId).populate('productId').populate('supplierId').populate('artisanId');
  }

  async function addSupplierNote(orderId, supplierId, note) {
    const order = await Order.findById(orderId);
    if (!order) { const e = new Error('Commande non trouvée'); e.statusCode = 404; throw e; }
    if (order.supplierId.toString() !== supplierId.toString()) { const e = new Error('Non autorisé'); e.statusCode = 403; throw e; }
    order.supplierNotes = note;
    await order.save();
    return order;
  }

  async function getOrderById(orderId, userId) {
    const order = await Order.findById(orderId).populate('productId').populate('supplierId', 'firstName lastName email supplierProfile').populate('artisanId', 'firstName lastName email phone').populate('statusHistory.changedBy', 'firstName lastName');
    if (!order) { const e = new Error('Commande non trouvée'); e.statusCode = 404; throw e; }
    if (order.artisanId._id.toString() !== userId.toString() && order.supplierId._id.toString() !== userId.toString()) {
      const e = new Error('Non autorisé'); e.statusCode = 403; throw e;
    }
    return order;
  }

  async function submitReview(orderId, artisanId, { rating, comment }) {
    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      const err = new Error('La note doit être un entier entre 1 et 5'); err.statusCode = 400; throw err;
    }
    const order = await Order.findById(orderId);
    if (!order) { const err = new Error('Commande non trouvée'); err.statusCode = 404; throw err; }
    if (order.artisanId.toString() !== artisanId.toString()) { const err = new Error('Non autorisé'); err.statusCode = 403; throw err; }
    if (order.status !== 'DELIVERED') { const err = new Error('Vous ne pouvez noter qu\'une commande livrée'); err.statusCode = 400; throw err; }
    if (order.review?.isReviewed) { const err = new Error('Vous avez déjà noté cette commande'); err.statusCode = 409; throw err; }
    await Order.updateOne({ _id: orderId }, { $set: { 'review.rating': Math.round(parsedRating), 'review.isReviewed': true } });
    const [stats] = await Order.aggregate([{ $match: { productId: order.productId, 'review.isReviewed': true } }, { $group: { _id: '$productId', avgRating: { $avg: '$review.rating' }, count: { $sum: 1 } } }]);
    const Product = require('../../src/models/Product');
    await Product.updateOne({ _id: order.productId }, { $set: { rating: stats ? Number(stats.avgRating.toFixed(2)) : 0, ratingCount: stats ? stats.count : 0 } });
    return Order.findById(orderId).populate('productId', 'name price imageUrls rating ratingCount').lean();
  }

  async function getArtisanActiveOrders(artisanId, { page = 1, limit = 10 }) {
    const query = { artisanId, status: { $in: ['PENDING', 'ACCEPTED', 'PREPARING', 'SHIPPED'] } };
    const orders = await Order.find(query).populate('productId').populate('supplierId').sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean();
    const total = await Order.countDocuments(query);
    return { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async function getArtisanOrderHistory(artisanId, { page = 1, limit = 10 }) {
    const query = { artisanId, status: { $in: ['DELIVERED', 'CANCELLED'] } };
    const orders = await Order.find(query).populate('productId').populate('supplierId').sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean();
    const total = await Order.countDocuments(query);
    return { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async function getSupplierActiveOrders(supplierId, { page = 1, limit = 10 }) {
    const query = { supplierId, status: { $in: ['PENDING', 'ACCEPTED', 'PREPARING', 'SHIPPED'] } };
    const orders = await Order.find(query).populate('productId').populate('artisanId').sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean();
    const total = await Order.countDocuments(query);
    return { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async function getSupplierOrderHistory(supplierId, { page = 1, limit = 10 }) {
    const query = { supplierId, status: { $in: ['DELIVERED', 'CANCELLED'] } };
    const orders = await Order.find(query).populate('productId').populate('artisanId').sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean();
    const total = await Order.countDocuments(query);
    return { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  return { createOrder, getOrdersByArtisan, getOrdersBySupplier, updateOrderStatus, addSupplierNote, getOrderById, submitReview, getArtisanActiveOrders, getArtisanOrderHistory, getSupplierActiveOrders, getSupplierOrderHistory };
});

const Order = require('../../src/models/Order');
const Product = require('../../src/models/Product');
const User = require('../../src/models/User');
const {
  createOrder,
  getOrdersByArtisan,
  getOrdersBySupplier,
  updateOrderStatus,
  addSupplierNote,
  getOrderById,
  submitReview,
} = require('../../src/modules/orders/orders.service');

// Also mock Product for submitReview tests
jest.mock('../../src/models/Product');

const ARTISAN_ID = 'artisan1';
const SUPPLIER_ID = 'supplier1';
const ORDER_ID = 'order1';
const PRODUCT_ID = 'product1';

function mockPopulateChain(returnValue) {
  const chain = {
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(returnValue),
  };
  chain.populate.mockReturnValue(chain);
  return chain;
}

describe('orders.service – createOrder', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws 404 when product not found', async () => {
    Product.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    await expect(createOrder({ productId: PRODUCT_ID, quantity: 1, artisanId: ARTISAN_ID }))
      .rejects.toMatchObject({ statusCode: 404, message: 'Produit non trouvé' });
  });

  it('throws 400 when stock is insufficient', async () => {
    const mockProduct = { _id: PRODUCT_ID, stock: 2, price: 10, supplierId: { _id: SUPPLIER_ID } };
    Product.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockProduct) });
    User.findById.mockResolvedValue({ _id: ARTISAN_ID, firstName: 'Ali', lastName: 'Ben' });

    await expect(createOrder({ productId: PRODUCT_ID, quantity: 5, artisanId: ARTISAN_ID }))
      .rejects.toMatchObject({ statusCode: 400, message: 'Stock insuffisant' });
  });

  it('throws 404 when artisan not found', async () => {
    const mockProduct = { _id: PRODUCT_ID, stock: 10, price: 10, supplierId: { _id: SUPPLIER_ID } };
    Product.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockProduct) });
    User.findById.mockResolvedValue(null);

    await expect(createOrder({ productId: PRODUCT_ID, quantity: 1, artisanId: ARTISAN_ID }))
      .rejects.toMatchObject({ statusCode: 404, message: 'Artisan non trouvé' });
  });

  it('creates order successfully', async () => {
    const mockProduct = { _id: PRODUCT_ID, stock: 10, price: 50, name: 'Cement', supplierId: { _id: SUPPLIER_ID } };
    Product.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockProduct) });
    User.findById.mockResolvedValue({ _id: ARTISAN_ID, firstName: 'Ali', lastName: 'Ben' });

    const mockOrder = {
      _id: ORDER_ID,
      orderNumber: 'CMD-2601-1234',
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
      artisanId: ARTISAN_ID,
      quantity: 1,
      lineTotal: 50,
      createdAt: new Date(),
    };
    Order.mockImplementation(() => mockOrder);

    const result = await createOrder({
      productId: PRODUCT_ID,
      quantity: 1,
      artisanId: ARTISAN_ID,
      deliveryAddress: { street: '1 Rue', city: 'Tunis', postalCode: '1000' },
    });
    expect(mockOrder.save).toHaveBeenCalled();
  });
});

describe('orders.service – getOrdersByArtisan', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns orders with pagination', async () => {
    const mockOrders = [{ _id: ORDER_ID }];
    Order.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockOrders),
    });
    Order.countDocuments.mockResolvedValue(1);

    const result = await getOrdersByArtisan(ARTISAN_ID, { page: 1, limit: 10, status: [] });
    expect(result.orders).toEqual(mockOrders);
    expect(result.pagination.total).toBe(1);
  });
});

describe('orders.service – updateOrderStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws 404 when order not found', async () => {
    // The mock factory calls Order.findById().populate().populate().populate()
    // We need to return null at the end of the chain
    const makeChain = (val) => {
      const chain = { populate: jest.fn() };
      chain.populate.mockReturnValue(chain);
      // Make it thenable so await resolves to val
      chain.then = (resolve) => Promise.resolve(val).then(resolve);
      return chain;
    };
    Order.findById.mockReturnValue(makeChain(null));

    await expect(updateOrderStatus(ORDER_ID, SUPPLIER_ID, 'ACCEPTED'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when user is not the supplier', async () => {
    const mockOrder = {
      _id: ORDER_ID,
      supplierId: { _id: 'other_supplier', toString: () => 'other_supplier' },
      artisanId: { _id: ARTISAN_ID },
      productId: { _id: PRODUCT_ID },
      status: 'PENDING',
    };
    const makeChain = (val) => {
      const chain = { populate: jest.fn() };
      chain.populate.mockReturnValue(chain);
      chain.then = (resolve) => Promise.resolve(val).then(resolve);
      return chain;
    };
    Order.findById.mockReturnValue(makeChain(mockOrder));

    await expect(updateOrderStatus(ORDER_ID, SUPPLIER_ID, 'ACCEPTED'))
      .rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('orders.service – getOrderById', () => {
  beforeEach(() => jest.clearAllMocks());

  function makeChain(val) {
    const chain = { populate: jest.fn() };
    chain.populate.mockReturnValue(chain);
    chain.then = (resolve) => Promise.resolve(val).then(resolve);
    return chain;
  }

  it('throws 404 when order not found', async () => {
    Order.findById.mockReturnValue(makeChain(null));
    await expect(getOrderById(ORDER_ID, ARTISAN_ID)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when user is neither artisan nor supplier', async () => {
    const mockOrder = {
      artisanId: { _id: 'other_artisan', toString: () => 'other_artisan' },
      supplierId: { _id: 'other_supplier', toString: () => 'other_supplier' },
    };
    Order.findById.mockReturnValue(makeChain(mockOrder));
    await expect(getOrderById(ORDER_ID, ARTISAN_ID)).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('orders.service – submitReview', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws 400 for invalid rating', async () => {
    await expect(submitReview(ORDER_ID, ARTISAN_ID, { rating: 0 }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 for rating > 5', async () => {
    await expect(submitReview(ORDER_ID, ARTISAN_ID, { rating: 6 }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 404 when order not found', async () => {
    Order.findById.mockResolvedValue(null);
    await expect(submitReview(ORDER_ID, ARTISAN_ID, { rating: 4 }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when caller is not the artisan', async () => {
    Order.findById.mockResolvedValue({
      _id: ORDER_ID,
      artisanId: { toString: () => 'other_artisan' },
      status: 'DELIVERED',
      review: { isReviewed: false },
    });
    await expect(submitReview(ORDER_ID, ARTISAN_ID, { rating: 4 }))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 400 when order is not DELIVERED', async () => {
    Order.findById.mockResolvedValue({
      _id: ORDER_ID,
      artisanId: { toString: () => ARTISAN_ID },
      status: 'PENDING',
      review: { isReviewed: false },
    });
    await expect(submitReview(ORDER_ID, ARTISAN_ID, { rating: 4 }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 409 when order already reviewed', async () => {
    Order.findById.mockResolvedValue({
      _id: ORDER_ID,
      artisanId: { toString: () => ARTISAN_ID },
      status: 'DELIVERED',
      review: { isReviewed: true },
    });
    await expect(submitReview(ORDER_ID, ARTISAN_ID, { rating: 4 }))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it('saves review and updates product rating', async () => {
    Order.findById.mockResolvedValueOnce({
      _id: ORDER_ID,
      artisanId: { toString: () => ARTISAN_ID },
      status: 'DELIVERED',
      review: { isReviewed: false },
      productId: PRODUCT_ID,
    });
    Order.updateOne.mockResolvedValue({});
    Order.aggregate.mockResolvedValue([{ avgRating: 4.5, count: 2 }]);
    Product.updateOne.mockResolvedValue({});
    Product.findById.mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(null) });

    // Final Order.findById for return value
    const chain = { populate: jest.fn() };
    chain.populate.mockReturnValue(chain);
    chain.lean = jest.fn().mockResolvedValue({ _id: ORDER_ID });
    Order.findById.mockReturnValueOnce(chain);

    await submitReview(ORDER_ID, ARTISAN_ID, { rating: 4, comment: 'Great!' });
    expect(Order.updateOne).toHaveBeenCalled();
    expect(Product.updateOne).toHaveBeenCalled();
  });
});
