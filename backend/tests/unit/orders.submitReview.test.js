'use strict';
jest.mock('../../src/models/Order');
jest.mock('../../src/models/Product');
jest.mock('../../src/models/Subscription');
jest.mock('../../src/models/ArtisanProfile');
jest.mock('../../src/models/SupplierProfile');
jest.mock('../../src/models/Notification');
jest.mock('../../src/socket', () => ({ notifyUser: jest.fn() }));

const Order = require('../../src/models/Order');
const Product = require('../../src/models/Product');

const { submitReview } = require('../../src/modules/orders/orders.service');

beforeEach(() => jest.clearAllMocks());

describe('orders.service — submitReview', () => {
  it('throws 400 when rating is invalid', async () => {
    await expect(submitReview('o1', 'a1', { rating: 0, comment: 'test' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when rating is too high', async () => {
    await expect(submitReview('o1', 'a1', { rating: 6, comment: 'test' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when rating is NaN', async () => {
    await expect(submitReview('o1', 'a1', { rating: 'abc', comment: 'test' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 404 when order not found', async () => {
    Order.findById.mockResolvedValueOnce(null);
    await expect(submitReview('o1', 'a1', { rating: 4, comment: 'test' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when not the buyer', async () => {
    Order.findById.mockResolvedValueOnce({
      _id: 'o1',
      artisanId: { toString: () => 'other-artisan' },
      status: 'DELIVERED',
      review: {},
    });
    await expect(submitReview('o1', 'artisan1', { rating: 4, comment: 'test' }))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 400 when order not delivered', async () => {
    Order.findById.mockResolvedValueOnce({
      _id: 'o1',
      artisanId: { toString: () => 'artisan1' },
      status: 'PENDING',
      review: {},
    });
    await expect(submitReview('o1', 'artisan1', { rating: 4, comment: 'test' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 409 when already reviewed', async () => {
    Order.findById.mockResolvedValueOnce({
      _id: 'o1',
      artisanId: { toString: () => 'artisan1' },
      status: 'DELIVERED',
      review: { isReviewed: true },
    });
    await expect(submitReview('o1', 'artisan1', { rating: 4, comment: 'test' }))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it('submits review successfully', async () => {
    const order = {
      _id: 'o1',
      artisanId: { toString: () => 'artisan1' },
      status: 'DELIVERED',
      review: { isReviewed: false },
      productId: 'prod1',
    };
    Order.findById
      .mockResolvedValueOnce(order)  // first call in submitReview
      .mockReturnValueOnce({         // last call to return updated order
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...order, review: { rating: 4, isReviewed: true } }),
      });
    Order.updateOne.mockResolvedValue({ modifiedCount: 1 });
    Order.aggregate.mockResolvedValue([{ avgRating: 4.0, count: 1 }]);
    Product.updateOne.mockResolvedValue({ modifiedCount: 1 });
    Product.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ _id: 'prod1', supplierId: 'supplier1' }),
    });

    const result = await submitReview('o1', 'artisan1', { rating: 4, comment: 'Great product!' });
    expect(Order.updateOne).toHaveBeenCalled();
    expect(Product.updateOne).toHaveBeenCalled();
  });

  it('handles no stats from aggregate (no previous reviews)', async () => {
    const order = {
      _id: 'o1',
      artisanId: { toString: () => 'artisan1' },
      status: 'DELIVERED',
      review: { isReviewed: false },
      productId: 'prod1',
    };
    Order.findById
      .mockResolvedValueOnce(order)
      .mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...order, review: { rating: 5, isReviewed: true } }),
      });
    Order.updateOne.mockResolvedValue({ modifiedCount: 1 });
    Order.aggregate.mockResolvedValue([]); // no stats
    Product.updateOne.mockResolvedValue({ modifiedCount: 1 });
    Product.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null), // no product found
    });

    await submitReview('o1', 'artisan1', { rating: 5, comment: 'Excellent!' });
    expect(Product.updateOne).toHaveBeenCalledWith(
      { _id: 'prod1' },
      { $set: { rating: 0, ratingCount: 0 } }
    );
  });
});
