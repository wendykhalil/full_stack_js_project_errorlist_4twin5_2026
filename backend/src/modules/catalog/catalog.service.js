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

module.exports = { getProducts };
