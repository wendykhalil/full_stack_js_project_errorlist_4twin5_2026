const catalogService = require('./catalog.service');
const apiResponse = require('../../utils/apiResponse');

// GET /api/catalog/products
const getProducts = async (req, res) => {
  try {
    const { page, limit, search, category, approved } = req.query;
    const products = await catalogService.getProducts({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12,
      search: search || '',
      category: category || '',
      approved
    });
    apiResponse(res, 'Products retrieved', products);
  } catch (error) {
    apiResponse(res, error.message, null, 400);
  }
};

module.exports = { getProducts };
