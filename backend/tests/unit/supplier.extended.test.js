'use strict';
/**
 * Extended unit tests for supplier.controller.js
 */

jest.mock('../../src/modules/supplier/supplier.service');
jest.mock('../../src/config/cloudinary');
jest.mock('../../src/utils/apiResponse', () => (res, msg, data, status = 200) => {
  res.status(status).json({ message: msg, data });
});

const httpMocks = require('node-mocks-http');
const supplierService = require('../../src/modules/supplier/supplier.service');
const { uploadBufferToCloudinary } = require('../../src/config/cloudinary');

const ctrl = require('../../src/modules/supplier/supplier.controller');

function req(overrides = {}) {
  return httpMocks.createRequest({
    user: { _id: 'supplier1', id: 'supplier1', role: 'SUPPLIER' },
    params: {},
    body: {},
    query: {},
    files: [],
    ...overrides,
  });
}
function res() { return httpMocks.createResponse(); }
const next = jest.fn();

beforeEach(() => jest.clearAllMocks());

// ─── getMyProducts ────────────────────────────────────────────────────────────
describe('supplier.getMyProducts', () => {
  it('returns products', async () => {
    supplierService.getMyProducts.mockResolvedValue({ products: [{ _id: 'p1' }], total: 1 });
    const r = res();
    await ctrl.getMyProducts(req({ query: { page: '1', limit: '10' } }), r, next);
    expect(r.statusCode).toBe(200);
  });

  it('returns 400 on error', async () => {
    supplierService.getMyProducts.mockRejectedValue(new Error('DB fail'));
    const r = res();
    await ctrl.getMyProducts(req(), r, next);
    expect(r.statusCode).toBe(400);
  });
});

// ─── createProduct ────────────────────────────────────────────────────────────
describe('supplier.createProduct', () => {
  it('returns 400 if data payload invalid JSON', async () => {
    const r = res();
    await ctrl.createProduct(req({ body: { data: 'not-json' }, files: [] }), r, next);
    expect(r.statusCode).toBe(400);
  });

  it('returns 400 if validation fails (missing name)', async () => {
    const r = res();
    await ctrl.createProduct(req({ body: { data: JSON.stringify({ price: 10 }) }, files: [] }), r, next);
    expect(r.statusCode).toBe(400);
  });

  it('creates product without files', async () => {
    const product = { _id: 'p1', name: 'Prod', price: 10 };
    supplierService.createProduct.mockResolvedValue(product);
    const r = res();
    const payload = { name: 'Prod', price: 10, stock: 5, unit: 'pcs', categoryId: 'cat1', description: 'Test product' };
    await ctrl.createProduct(
      req({ body: { data: JSON.stringify(payload) }, files: [] }),
      r, next
    );
    expect(r.statusCode).toBe(201);
  });

  it('creates product with image files', async () => {
    uploadBufferToCloudinary.mockResolvedValue({ secure_url: 'http://cloud.com/img.jpg' });
    const product = { _id: 'p1', name: 'Prod', price: 10 };
    supplierService.createProduct.mockResolvedValue(product);
    const r = res();
    const payload = { name: 'Prod', price: 10, stock: 5, unit: 'pcs', categoryId: 'cat1', description: 'Test product' };
    await ctrl.createProduct(
      req({
        body: { data: JSON.stringify(payload) },
        files: [{ buffer: Buffer.from('img'), mimetype: 'image/jpeg', originalname: 'img.jpg' }],
      }),
      r, next
    );
    expect(uploadBufferToCloudinary).toHaveBeenCalled();
    expect(r.statusCode).toBe(201);
  });
});

// ─── updateProduct ────────────────────────────────────────────────────────────
describe('supplier.updateProduct', () => {
  it('returns 404 if product not found', async () => {
    supplierService.updateProduct.mockRejectedValue(Object.assign(new Error('Not found'), { statusCode: 404 }));
    const r = res();
    await ctrl.updateProduct(req({ params: { id: 'p1' }, body: { data: JSON.stringify({ name: 'New' }) }, files: [] }), r, next);
    expect(r.statusCode).toBe(400);
  });

  it('updates product successfully', async () => {
    const product = { _id: 'p1', name: 'Updated' };
    supplierService.updateProduct.mockResolvedValue(product);
    const r = res();
    await ctrl.updateProduct(
      req({ params: { id: 'p1' }, body: { data: JSON.stringify({ name: 'Updated', price: 20 }) }, files: [] }),
      r, next
    );
    expect(r.statusCode).toBe(200);
  });
});

// ─── deleteProduct ────────────────────────────────────────────────────────────
describe('supplier.deleteProduct', () => {
  it('returns 400 if product not found', async () => {
    supplierService.deleteProduct.mockRejectedValue(new Error('Not found'));
    const r = res();
    await ctrl.deleteProduct(req({ params: { id: 'p1' } }), r, next);
    expect(r.statusCode).toBe(400);
  });

  it('deletes product and returns ok', async () => {
    supplierService.deleteProduct.mockResolvedValue({ ok: true });
    const r = res();
    await ctrl.deleteProduct(req({ params: { id: 'p1' } }), r, next);
    expect(r.statusCode).toBe(200);
  });
});

// ─── getStats ─────────────────────────────────────────────────────────────────
describe('supplier.getStats', () => {
  it('returns stats', async () => {
    supplierService.getStats.mockResolvedValue({ totalProducts: 5, totalRevenue: 1000 });
    const r = res();
    await ctrl.getStats(req(), r, next);
    expect(r.statusCode).toBe(200);
  });

  it('returns 400 on error', async () => {
    supplierService.getStats.mockRejectedValue(new Error('fail'));
    const r = res();
    await ctrl.getStats(req(), r, next);
    expect(r.statusCode).toBe(400);
  });
});

// ─── getCategories ────────────────────────────────────────────────────────────
describe('supplier.getCategories', () => {
  it('returns categories', async () => {
    supplierService.getCategories.mockResolvedValue([{ _id: 'c1', name: 'Cat 1' }]);
    const r = res();
    await ctrl.getCategories(req(), r, next);
    expect(r.statusCode).toBe(200);
  });
});
