'use strict';

jest.mock('../../src/modules/supplier/supplier.service');
jest.mock('../../src/utils/apiResponse');
jest.mock('../../src/config/cloudinary', () => ({
  uploadBufferToCloudinary: jest.fn().mockResolvedValue({ secure_url: 'https://cdn.example.com/img.jpg' }),
}));

const supplierService = require('../../src/modules/supplier/supplier.service');
const apiResponse = require('../../src/utils/apiResponse');
const {
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getStats,
  getCategories,
} = require('../../src/modules/supplier/supplier.controller');

function makeReq(overrides = {}) {
  return {
    query: {},
    params: {},
    body: {},
    files: [],
    user: { _id: 'supplier1' },
    ...overrides,
  };
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('supplier.controller – getMyProducts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns products on success', async () => {
    supplierService.getMyProducts.mockResolvedValue({ products: [], pagination: {} });
    const req = makeReq({ query: { page: '1', limit: '10' } });
    const res = makeRes();
    await getMyProducts(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Produits récupérés', { products: [], pagination: {} });
  });

  it('returns 400 on error', async () => {
    supplierService.getMyProducts.mockRejectedValue(new Error('DB fail'));
    const req = makeReq();
    const res = makeRes();
    await getMyProducts(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'DB fail', null, 400);
  });
});

describe('supplier.controller – createProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when JSON payload is invalid', async () => {
    const req = makeReq({ body: { data: 'not-json' }, files: [] });
    const res = makeRes();
    await createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors: { data: 'Payload invalide' } });
  });

  it('returns 400 when validation fails (missing name)', async () => {
    const req = makeReq({
      body: { data: JSON.stringify({ price: 10, stock: 5, description: 'A long description here', categoryId: 'cat1' }) },
      files: [],
    });
    const res = makeRes();
    await createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates product on valid payload', async () => {
    const validData = {
      name: 'Cement',
      price: 10,
      stock: 5,
      description: 'A long description here',
      categoryId: 'cat1',
    };
    const req = makeReq({
      body: { data: JSON.stringify(validData) },
      files: [],
    });
    const res = makeRes();
    supplierService.createProduct.mockResolvedValue({ _id: 'prod1', ...validData });
    await createProduct(req, res);
    expect(supplierService.createProduct).toHaveBeenCalled();
    expect(apiResponse).toHaveBeenCalledWith(res, 'Produit créé avec succès', expect.any(Object), 201);
  });

  it('returns 400 on service error', async () => {
    const validData = {
      name: 'Cement',
      price: 10,
      stock: 5,
      description: 'A long description here',
      categoryId: 'cat1',
    };
    const req = makeReq({
      body: { data: JSON.stringify(validData) },
      files: [],
    });
    const res = makeRes();
    supplierService.createProduct.mockRejectedValue(new Error('DB error'));
    await createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('supplier.controller – deleteProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes product on success', async () => {
    supplierService.deleteProduct.mockResolvedValue({});
    const req = makeReq({ params: { id: 'prod1' } });
    const res = makeRes();
    await deleteProduct(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Produit supprimé');
  });

  it('returns 400 on error', async () => {
    supplierService.deleteProduct.mockRejectedValue(new Error('Not found'));
    const req = makeReq({ params: { id: 'prod1' } });
    const res = makeRes();
    await deleteProduct(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Not found', null, 400);
  });
});

describe('supplier.controller – getStats', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns stats on success', async () => {
    supplierService.getStats.mockResolvedValue({ activeProducts: 3 });
    const req = makeReq();
    const res = makeRes();
    await getStats(req, res);
    expect(apiResponse).toHaveBeenCalledWith(res, 'Statistiques récupérées', { activeProducts: 3 });
  });
});

describe('supplier.controller – validateCreateProductPayload', () => {
  // Test the validation logic indirectly through createProduct
  beforeEach(() => jest.clearAllMocks());

  it('rejects price <= 0', async () => {
    const data = { name: 'Cement', price: -1, stock: 5, description: 'A long description here', categoryId: 'cat1' };
    const req = makeReq({ body: { data: JSON.stringify(data) }, files: [] });
    const res = makeRes();
    await createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const call = res.json.mock.calls[0][0];
    expect(call.errors.price).toBeDefined();
  });

  it('rejects stock < 0', async () => {
    const data = { name: 'Cement', price: 10, stock: -1, description: 'A long description here', categoryId: 'cat1' };
    const req = makeReq({ body: { data: JSON.stringify(data) }, files: [] });
    const res = makeRes();
    await createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const call = res.json.mock.calls[0][0];
    expect(call.errors.stock).toBeDefined();
  });

  it('rejects description shorter than 10 chars', async () => {
    const data = { name: 'Cement', price: 10, stock: 5, description: 'Short', categoryId: 'cat1' };
    const req = makeReq({ body: { data: JSON.stringify(data) }, files: [] });
    const res = makeRes();
    await createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const call = res.json.mock.calls[0][0];
    expect(call.errors.description).toBeDefined();
  });

  it('rejects missing category', async () => {
    const data = { name: 'Cement', price: 10, stock: 5, description: 'A long description here' };
    const req = makeReq({ body: { data: JSON.stringify(data) }, files: [] });
    const res = makeRes();
    await createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const call = res.json.mock.calls[0][0];
    expect(call.errors.category).toBeDefined();
  });
});
