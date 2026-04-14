const catalogService = require('./catalog.service');
const apiResponse = require('../../utils/apiResponse');

// GET /api/catalog/products
const getProducts = async (req, res) => {
  try {
    const { page, limit, search, category, approved } = req.query;
    const products = await catalogService.getProducts({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 8,
      search: search || '',
      category: category || '',
      approved
    });
    apiResponse(res, 'Produits récupérés', products);
  } catch (error) {
    apiResponse(res, error.message, null, 400);
  }
};

const rateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const updatedProduct = await catalogService.rateProduct(id, rating);
    apiResponse(res, 'Rating added successfully', { rating: updatedProduct.rating, ratingCount: updatedProduct.ratingCount });
  } catch (error) {
    apiResponse(res, error.message, null, error.statusCode || 400);
  }
};

module.exports = { getProducts, rateProduct };
