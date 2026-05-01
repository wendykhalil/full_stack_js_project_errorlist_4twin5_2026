'use strict';
jest.mock('../../src/models/Product');
jest.mock('../../src/models/Order');
jest.mock('../../src/models/Category');
jest.mock('../../src/models/SupplierProfile');

const Product  = require('../../src/models/Product');
const Order    = require('../../src/models/Order');
const Category = require('../../src/models/Category');

const { updateProduct, deleteProduct, getStats, getCategories } =
  require('../../src/modules/supplier/supplier.service');

beforeEach(() => jest.clearAllMocks());

describe('supplier.service — updateProduct', () => {
  it('throws when product not found', async () => {
    Product.findById.mockResolvedValue(null);
    await expect(updateProduct('p1', { name: 'New' }, 's1')).rejects.toThrow('Product not found');
  });

  it('updates product successfully', async () => {
    const existing = { _id: 'p1', name: 'Old', price: 10, stock: 5, description: 'desc', categoryId: 'c1', imageUrls: [], documentation: [] };
    Product.findById.mockResolvedValue(existing);
    const updated = { _id: 'p1', name: 'New', populate: jest.fn().mockResolvedValue(true) };
    Product.findOneAndUpdate.mockResolvedValue(updated);
    const result = await updateProduct('p1', { name: 'New', price: 20 }, 's1');
    expect(result).toBeDefined();
  });

  it('throws when product not found or unauthorized', async () => {
    const existing = { _id: 'p1', name: 'Old', price: 10, stock: 5, description: 'desc', categoryId: 'c1', imageUrls: [], documentation: [] };
    Product.findById.mockResolvedValue(existing);
    Product.findOneAndUpdate.mockResolvedValue(null);
    await expect(updateProduct('p1', { name: 'New' }, 'wrong-supplier')).rejects.toThrow('Product not found or unauthorized');
  });

  it('creates new category when newCategory provided', async () => {
    const existing = { _id: 'p1', name: 'Old', price: 10, stock: 5, description: 'desc', categoryId: 'c1', imageUrls: [], documentation: [] };
    Product.findById.mockResolvedValue(existing);
    Category.findOne.mockResolvedValue(null);
    const newCat = { _id: 'newcat', save: jest.fn().mockResolvedValue(true) };
    Category.mockImplementation(() => newCat);
    const updated = { _id: 'p1', populate: jest.fn().mockResolvedValue(true) };
    Product.findOneAndUpdate.mockResolvedValue(updated);
    await updateProduct('p1', { newCategory: 'NewMaterial', name: 'Prod' }, 's1');
    expect(newCat.save).toHaveBeenCalled();
  });

  it('uses existing category when newCategory matches existing', async () => {
    const existing = { _id: 'p1', name: 'Old', price: 10, stock: 5, description: 'desc', categoryId: 'c1', imageUrls: [], documentation: [] };
    Product.findById.mockResolvedValue(existing);
    Category.findOne.mockResolvedValue({ _id: 'existingCat', name: 'Existing' });
    const updated = { _id: 'p1', populate: jest.fn().mockResolvedValue(true) };
    Product.findOneAndUpdate.mockResolvedValue(updated);
    await updateProduct('p1', { newCategory: 'Existing', name: 'Prod' }, 's1');
    expect(Product.findOneAndUpdate).toHaveBeenCalled();
  });
});

describe('supplier.service — deleteProduct', () => {
  it('deletes product successfully', async () => {
    Product.findOneAndDelete.mockResolvedValue({ _id: 'p1' });
    const result = await deleteProduct('p1', 's1');
    expect(result._id).toBe('p1');
  });

  it('throws when product not found', async () => {
    Product.findOneAndDelete.mockResolvedValue(null);
    await expect(deleteProduct('p1', 's1')).rejects.toThrow('Product not found or unauthorized');
  });
});

describe('supplier.service — getStats', () => {
  it('returns stats with revenue', async () => {
    Product.countDocuments.mockResolvedValue(10);
    Order.countDocuments.mockResolvedValue(3);
    // The service uses aggregate with $sum: '$lineTotal' and returns result[0].total
    Order.aggregate.mockResolvedValue([{ total: 5000 }]);
    const result = await getStats('s1');
    expect(result.activeProducts).toBe(10);
    expect(result.revenue).toBe(5000);
  });

  it('returns 0 revenue when no delivered orders', async () => {
    Product.countDocuments.mockResolvedValue(5);
    Order.countDocuments.mockResolvedValue(0);
    Order.aggregate.mockResolvedValue([]);
    const result = await getStats('s1');
    expect(result.revenue).toBe(0);
  });

  it('returns correct activeOrders count', async () => {
    Product.countDocuments.mockResolvedValue(8);
    Order.countDocuments.mockResolvedValue(4);
    Order.aggregate.mockResolvedValue([{ total: 1200 }]);
    const result = await getStats('s1');
    expect(result.activeOrders).toBe(4);
    expect(result.catalogs).toBe(3);
  });
});

describe('supplier.service — getCategories', () => {
  it('returns existing categories', async () => {
    Category.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: 'c1', name: 'Cat 1' }]),
    });
    const result = await getCategories();
    expect(result).toHaveLength(1);
  });

  it('creates default categories when none exist', async () => {
    Category.find
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: 'c1', name: 'Matériaux' }]),
      });
    Category.insertMany.mockResolvedValue([{ _id: 'c1' }]);
    const result = await getCategories();
    expect(result).toBeDefined();
  });

  it('handles empty categories gracefully', async () => {
    Category.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    Category.insertMany.mockResolvedValue([]);
    const result = await getCategories();
    expect(result).toBeDefined();
  });
});
