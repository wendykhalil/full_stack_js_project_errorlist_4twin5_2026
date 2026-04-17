const catalogService = require('./catalog.service');
const apiResponse = require('../../utils/apiResponse');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const { buildRecommendationFilter, scoreRecommendations } = require('./recommendations');
const { getProductVideo } = require('./video.service');

// ── In-process cache invalidation hook (imported lazily to avoid circular deps)
function invalidateInsightsCache(supplierId) {
  try {
    // The aiInsights cache is keyed by supplierId — we need the product's supplierId
    // We call this after a rating update so ML always gets fresh data
    const { cache: insightsCache } = require('../supplier/aiInsights.service');
    if (insightsCache && supplierId) insightsCache.delete(String(supplierId));
  } catch {
    // Non-critical — ignore if module not loaded
  }
}

// GET /api/catalog/products
const getProducts = async (req, res) => {
  try {
    const { page, limit, search, category, approved } = req.query;
    const products = await catalogService.getProducts({
      page:     parseInt(page)  || 1,
      limit:    parseInt(limit) || 8,
      search:   search   || '',
      category: category || '',
      approved,
    });
    apiResponse(res, 'Produits récupérés', products);
  } catch (error) {
    apiResponse(res, error.message, null, 400);
  }
};

// GET /api/catalog/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name slug')
      .populate('supplierId', 'companyName firstName lastName email phone')
      .lean();

    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    apiResponse(res, 'Produit récupéré', product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/catalog/products/:id/recommendations
const getRecommendations = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name slug')
      .lean();

    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });

    const allCategories = await Category.find().lean();
    const filter        = buildRecommendationFilter(product, allCategories);

    const candidates = await Product.find(filter)
      .populate('categoryId', 'name slug')
      .populate('supplierId', 'companyName firstName lastName')
      .limit(20)
      .lean();

    const scored          = scoreRecommendations(candidates, product).slice(0, 6);
    const recommendations = scored.map(({ _score, ...p }) => p);

    apiResponse(res, 'Recommandations récupérées', { recommendations, total: recommendations.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/catalog/products/:id/video
const getVideo = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name slug')
      .lean();

    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });

    const video = await getProductVideo(product);
    if (!video) return apiResponse(res, 'Aucune vidéo disponible', { video: null });

    apiResponse(res, 'Vidéo récupérée', { video });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/catalog/products/:id/rate
const rateProduct = async (req, res) => {
  try {
    const { id }     = req.params;
    const { rating } = req.body;
    const userId     = req.user?._id;

    const result = await catalogService.rateProduct(id, rating, userId);

    // Invalidate the supplier's ML insights cache so next /ai-insights fetch
    // uses the updated rating value
    const product = await Product.findById(id).select('supplierId').lean();
    if (product?.supplierId) invalidateInsightsCache(product.supplierId);

    apiResponse(res, 'Note enregistrée', {
      rating:      result.rating,
      ratingCount: result.ratingCount,
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({ message: error.message });
  }
};

module.exports = { getProducts, getProductById, getRecommendations, getVideo, rateProduct };

