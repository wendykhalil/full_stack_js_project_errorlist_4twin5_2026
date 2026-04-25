const Product = require('../../models/Product');
const Category = require('../../models/Category');

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
  if (approvedBool !== null) query.isApproved = approvedBool;
  if (search)    query.name       = { $regex: search, $options: 'i' };
  if (category)  query.categoryId = category;

  const safePage  = Number.isFinite(Number(page))  ? Math.max(1, Number.parseInt(page, 10))  : 1;
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Number.parseInt(limit, 10)) : 12;
  const skip = (safePage - 1) * safeLimit;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('categoryId', 'name slug')
      .populate('supplierId', 'companyName firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Product.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / safeLimit) || 1;

  return {
    products,
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalPages,
      totalItems: total,
      pages: totalPages,
      total,
    },
  };
};

/**
 * Rate a product atomically.
 *
 * Uses a single findOneAndUpdate with $inc + computed new average to avoid:
 *  - off-by-one errors from read-modify-write
 *  - race conditions under concurrent requests
 *
 * Formula: newAvg = (oldAvg * oldCount + newScore) / (oldCount + 1)
 * Expressed as a MongoDB update pipeline so it runs server-side.
 */
async function rateProduct(productId, rating, userId) {
  const parsedRating = Number(rating);

  if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    const err = new Error('La note doit être un entier entre 1 et 5');
    err.statusCode = 400;
    throw err;
  }

  const score = Math.round(parsedRating); // enforce integer 1-5

  // Atomic update pipeline — runs entirely in MongoDB, no race condition
  const updated = await Product.findOneAndUpdate(
    { _id: productId },
    [
      {
        $set: {
          ratingCount: { $add: [{ $ifNull: ['$ratingCount', 0] }, 1] },
          rating: {
            $divide: [
              {
                $add: [
                  { $multiply: [{ $ifNull: ['$rating', 0] }, { $ifNull: ['$ratingCount', 0] }] },
                  score,
                ],
              },
              { $add: [{ $ifNull: ['$ratingCount', 0] }, 1] },
            ],
          },
        },
      },
    ],
    { new: true, runValidators: false }
  );

  if (!updated) {
    const err = new Error('Produit non trouvé');
    err.statusCode = 404;
    throw err;
  }

  return {
    rating:      Number(updated.rating.toFixed(2)),
    ratingCount: updated.ratingCount,
  };
}

module.exports = { getProducts, rateProduct };

