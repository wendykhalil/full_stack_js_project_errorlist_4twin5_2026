'use strict';

jest.mock('../../src/models/Product');
jest.mock('../../src/models/Category');
jest.mock('../../src/models/Order');
jest.mock('../../src/models/SupplierProfile');

const Product = require('../../src/models/Product');
const Category = require('../../src/models/Category');
const Order = require('../../src/models/Order');
const {
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getStats,
  getCategories,
} = require('../../src/modules/supplier/supplier.service');

const SUPPLIER_ID = 'supplier123';

describe('supplier.service – getMyProducts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns products with pagination', async () => {
    const mockProducts = [{ _id: 'p1', name: 'Cement' }];
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockProducts),
    });
    Product.countDocuments.mockResolvedValue(1);

    const result = await getMyProducts(SUPPLIER_ID, { page: 1, limit: 10 });
    expect(result.products).toEqual(mockProducts);
    expect(result.pagination.total).toBe(1);
  });

  it('applies search filter', async () => {
    Product.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    Product.countDocuments.mockResolvedValue(0);

    await getMyProducts(SUPPLIER_ID, { page: 1, limit: 10, search: 'cement' });
    const query = Product.find.mock.calls[0][0];
    expect(query.name).toEqual({ $regex: 'cement', $options: 'i' });
  });
});

describe('supplier.service – createProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws when supplierId is missing', async () => {
    await expect(createProduct({}, null)).rejects.toThrow('Supplier ID is required');
  });

  it('creates product with existing category', async () => {
    const mockCategory = { _id: 'cat1', name: 'Paint' };
    Category.findOne.mockResolvedValue(null);
    Category.findOne.mockResolvedValueOnce(null);

    const mockProduct = {
      _id: 'prod1',
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };

    // Mock Product constructor
    const ProductMock = jest.fn().mockImplementation(() => mockProduct);
    ProductMock.findOne = Product.findOne;
    ProductMock.find = Product.find;
    ProductMock.countDocuments = Product.countDocuments;

    // Use the real module but mock the save
    Category.findOne.mockResolvedValue(mockCategory);

    const data = { categoryId: 'cat1', name: 'Cement', price: 10, stock: 5 };
    // We need to mock the Product constructor - use the existing mock
    const mockSave = jest.fn().mockResolvedValue(true);
    const mockPopulate = jest.fn().mockResolvedValue(true);
    Product.mockImplementation(() => ({ save: mockSave, populate: mockPopulate }));

    const result = await createProduct(data, SUPPLIER_ID);
    expect(mockSave).toHaveBeenCalled();
  });

  it('creates new category when newCategory is provided', async () => {
    Category.findOne.mockResolvedValue(null);
    const mockNewCat = { _id: 'newcat1', save: jest.fn().mockResolvedValue(true) };
    Category.mockImplementation(() => mockNewCat);

    const mockSave = jest.fn().mockResolvedValue(true);
    const mockPopulate = jest.fn().mockResolvedValue(true);
    Product.mockImplementation(() => ({ save: mockSave, populate: mockPopulate }));

    const data = { newCategory: 'NewMaterial', name: 'Tile', price: 5, stock: 10 };
    await createProduct(data, SUPPLIER_ID);
    expect(Category.findOne).toHaveBeenCalled();
  });
});

describe('supplier.service – deleteProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws when product not found or unauthorized', async () => {
    Product.findOneAndDelete.mockResolvedValue(null);
    await expect(deleteProduct('prod1', SUPPLIER_ID)).rejects.toThrow('Product not found or unauthorized');
  });

  it('returns deleted product on success', async () => {
    const mockProduct = { _id: 'prod1' };
    Product.findOneAndDelete.mockResolvedValue(mockProduct);
    const result = await deleteProduct('prod1', SUPPLIER_ID);
    expect(result).toEqual(mockProduct);
  });
});

describe('supplier.service – getStats', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns stats with revenue', async () => {
    Product.countDocuments.mockResolvedValue(5);
    Order.countDocuments.mockResolvedValue(3);
    Order.aggregate.mockResolvedValue([{ total: 1500 }]);

    const result = await getStats(SUPPLIER_ID);
    expect(result.activeProducts).toBe(5);
    expect(result.activeOrders).toBe(3);
    expect(result.revenue).toBe(1500);
  });

  it('returns 0 revenue when no delivered orders', async () => {
    Product.countDocuments.mockResolvedValue(2);
    Order.countDocuments.mockResolvedValue(0);
    Order.aggregate.mockResolvedValue([]);

    const result = await getStats(SUPPLIER_ID);
    expect(result.revenue).toBe(0);
  });
});

describe('supplier.service – getCategories', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns existing categories', async () => {
    const mockCats = [{ _id: 'c1', name: 'Paint' }];
    Category.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockCats),
    });

    const result = await getCategories();
    expect(result).toEqual(mockCats);
  });

  it('creates default categories when none exist', async () => {
    Category.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    Category.insertMany.mockResolvedValue([{ name: 'Basic Materials' }]);

    const result = await getCategories();
    expect(Category.insertMany).toHaveBeenCalled();
  });
});
