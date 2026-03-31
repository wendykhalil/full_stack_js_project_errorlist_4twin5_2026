const Product = require('../../models/Product');
const Category = require('../../models/Category');
const apiResponse = require('../../utils/apiResponse');

// Get all public products for marketplace
const getProducts = async ({ page = 1, limit = 12, search = '', category = '', approved = true } = {}) => {
  const query = {};
  if (approved !== undefined && approved !== 'all') {
    query.isApproved = approved === 'true';
  }
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }
  if (category) {
    query.categoryId = category;
  }

  const skip = (page - 1) * limit;
  const products = await Product.find(query)
    .populate('categoryId', 'name slug')
    .populate('supplierId', 'companyName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Product.countDocuments(query);

  return {
    products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
};

async function rateProduct(productId, rating) {
  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const parsedRating = Number(rating);
  if (!Number.isFinite(parsedRating) || parsedRating < 0 || parsedRating > 5) {
    const error = new Error('Rating must be a number between 0 and 5');
    error.statusCode = 400;
    throw error;
  }

  product.ratingCount = (product.ratingCount || 0) + 1;
  const previousTotal = (product.rating || 0) * ((product.ratingCount || 1) - 1);
  product.rating = (previousTotal + parsedRating) / product.ratingCount;

  await product.save();

  return product;
}

module.exports = { getProducts, rateProduct };
