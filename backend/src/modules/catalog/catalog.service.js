const Product = require('../../models/Product');
const Category = require('../../models/Category');
const apiResponse = require('../../utils/apiResponse');

function normalizeApproved(approved) {
  if (approved === undefined || approved === null || approved === '' || approved === 'all') return null;
  if (typeof approved === 'boolean') return approved;
  if (approved === 'true') return true;
  if (approved === 'false') return false;
  return null;
}

// Get all public products for marketplace
const getProducts = async ({ page = 1, limit = 12, search = '', category = '', approved } = {}) => {
  const query = {};
  const approvedBool = normalizeApproved(approved);
  if (approvedBool !== null) {
    query.isApproved = approvedBool;
  }
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }
  if (category) {
    query.categoryId = category;
  }

  const safePage = Number.isFinite(Number(page)) ? Math.max(1, parseInt(page, 10)) : 1;
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, parseInt(limit, 10)) : 12;
  const skip = (safePage - 1) * safeLimit;
  const products = await Product.find(query)
    .populate('categoryId', 'name slug')
    .populate('supplierId', 'companyName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(safeLimit)
    .lean();

  const total = await Product.countDocuments(query);
  const totalPages = Math.ceil(total / safeLimit) || 1;

  return {
    products,
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalPages,
      totalItems: total,
      // Backward compatibility for any existing frontend usage
      pages: totalPages,
      total,
    }
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
