/**
 * aiInsights.service.js
 * Fetches supplier products + their order counts, sends them to the ML
 * microservice, and returns a structured insights report.
 */

const Product = require('../../models/Product');
const Order   = require('../../models/Order');
const { predictBatch, retrainModel, getModelMeta, isHealthy } = require('./ml.client');

// Per-supplier in-memory cache  { supplierId → { data, expiresAt } }
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const LABEL_ORDER = { BEST_SELLER: 0, RESTOCK: 1, NORMAL: 2, UNDERPERFORMING: 3 };

/**
 * Collect aggregated product metrics for a supplier.
 */
async function collectProductMetrics(supplierId) {
  const products = await Product.find({ supplierId })
    .populate('categoryId', 'name')
    .lean();

  if (products.length === 0) return [];

  const productIds = products.map(p => p._id);

  const orderAgg = await Order.aggregate([
    { $match: { supplierId, productId: { $in: productIds } } },
    { $group: { _id: '$productId', totalOrders: { $sum: 1 } } },
  ]);

  const orderMap = new Map(orderAgg.map(r => [String(r._id), r.totalOrders]));

  return products.map(p => ({
    productId:   String(p._id),
    productName: p.name,
    price:       Number(p.price)  || 0,
    stock:       Number(p.stock)  || 0,
    orders:      orderMap.get(String(p._id)) || 0,
    rating:      Number(p.rating) || 0,
    category:    p.categoryId?.name || 'N/A',
    imageUrl:    p.imageUrls?.[0]   || null,
  }));
}

/**
 * Get AI insights for a supplier (with cache).
 */
async function getAiInsights(supplierId, forceRefresh = false) {
  const key = String(supplierId);
  const now = Date.now();

  if (!forceRefresh && cache.has(key)) {
    const cached = cache.get(key);
    if (now < cached.expiresAt) return { ...cached.data, cached: true };
    cache.delete(key);
  }

  const mlUp = await isHealthy();
  if (!mlUp) {
    throw new Error('ML service is unavailable. Please start the Python microservice (cd ml-service && python app.py).');
  }

  const metrics = await collectProductMetrics(supplierId);

  if (metrics.length === 0) {
    return {
      totalProducts: 0,
      predictions:   [],
      summary:       { BEST_SELLER: [], RESTOCK: [], UNDERPERFORMING: [], NORMAL: [] },
      generatedAt:   new Date().toISOString(),
      cached:        false,
    };
  }

  const mlPayload = metrics.map(({ productId, productName, price, stock, orders, rating }) => ({
    productId, productName, price, stock, orders, rating,
  }));

  const mlResults = await predictBatch(mlPayload);
  const metaMap   = new Map(metrics.map(m => [m.productId, m]));

  const predictions = mlResults
    .filter(r => !r.error)
    .map(r => {
      const meta = metaMap.get(r.productId) || {};
      return {
        productId:      r.productId,
        productName:    r.productName,
        label:          r.label,
        confidence:     r.confidence,
        recommendation: r.recommendation,
        probabilities:  r.probabilities,
        price:    meta.price,
        stock:    meta.stock,
        orders:   meta.orders,
        rating:   meta.rating,
        category: meta.category,
        imageUrl: meta.imageUrl,
      };
    })
    .sort((a, b) => (LABEL_ORDER[a.label] ?? 99) - (LABEL_ORDER[b.label] ?? 99));

  const summary = {
    BEST_SELLER:     predictions.filter(p => p.label === 'BEST_SELLER'),
    RESTOCK:         predictions.filter(p => p.label === 'RESTOCK'),
    NORMAL:          predictions.filter(p => p.label === 'NORMAL'),
    UNDERPERFORMING: predictions.filter(p => p.label === 'UNDERPERFORMING'),
  };

  const result = {
    totalProducts: predictions.length,
    predictions,
    summary,
    generatedAt: new Date().toISOString(),
    cached: false,
  };

  cache.set(key, { data: result, expiresAt: now + CACHE_TTL_MS });
  return result;
}

/**
 * Retrain the ML model using this supplier's live product data,
 * then invalidate the insights cache so the next fetch uses the new model.
 */
async function retrainAiModel(supplierId) {
  const mlUp = await isHealthy();
  if (!mlUp) {
    throw new Error('ML service is unavailable. Please start the Python microservice.');
  }

  const metrics = await collectProductMetrics(supplierId);

  // Build the payload — only the 4 numeric features needed for training
  const payload = metrics.map(({ price, stock, orders, rating }) => ({
    price, stock, orders, rating,
  }));

  const result = await retrainModel(payload);

  // Invalidate cache so next /ai-insights call uses the freshly trained model
  cache.delete(String(supplierId));

  return {
    status:        'success',
    message:       result.message || 'Model retrained successfully',
    samplesUsed:   result.samples_used ?? payload.length,
    liveSamples:   result.live_samples ?? payload.length,
    accuracy:      result.accuracy ?? null,
    lastTrainedAt: result.lastTrainedAt ?? new Date().toISOString(),
    classes:       result.classes ?? [],
  };
}

module.exports = { getAiInsights, retrainAiModel, collectProductMetrics, cache };
