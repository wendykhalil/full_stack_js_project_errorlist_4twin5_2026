/**
 * Rule-based complementary product recommendation engine.
 * Maps category slugs/names to complementary category slugs.
 * "Complementary" = what you need WITH this product, not similar products.
 */

// Category name → array of complementary category names
const COMPLEMENTARY_MAP = {
  // Paint → needs brushes, rollers, primer, masking tape
  'peinture':        ['outillage', 'accessoires', 'preparation', 'enduit', 'isolation'],
  'paint':           ['tools', 'accessories', 'preparation'],

  // Plumbing → needs fittings, sealant, tools
  'plomberie':       ['robinetterie', 'outillage', 'etancheite', 'sanitaire'],
  'plumbing':        ['fittings', 'tools', 'sealant'],

  // Electrical → needs conduit, connectors, tools
  'electricite':     ['outillage', 'accessoires', 'securite', 'eclairage'],
  'electrical':      ['tools', 'accessories', 'lighting'],

  // Tiling → needs adhesive, grout, spacers, tools
  'carrelage':       ['colle', 'joint', 'outillage', 'preparation', 'etancheite'],
  'tiles':           ['adhesive', 'grout', 'tools'],

  // Cement / masonry → needs reinforcement, formwork, tools
  'ciment':          ['ferraillage', 'coffrage', 'outillage', 'agregats'],
  'cement':          ['reinforcement', 'formwork', 'tools'],
  'maconnerie':      ['ciment', 'ferraillage', 'outillage', 'agregats'],

  // Wood / carpentry → needs screws, varnish, tools
  'menuiserie':      ['visserie', 'vernis', 'outillage', 'protection'],
  'wood':            ['screws', 'varnish', 'tools'],

  // Insulation → needs adhesive, vapor barrier, tools
  'isolation':       ['colle', 'etancheite', 'outillage', 'fixation'],
  'insulation':      ['adhesive', 'vapor-barrier', 'tools'],

  // Roofing → needs waterproofing, fixings, tools
  'toiture':         ['etancheite', 'fixation', 'outillage', 'isolation'],
  'roofing':         ['waterproofing', 'fixings', 'tools'],

  // Tools → needs consumables, safety gear
  'outillage':       ['securite', 'consommables', 'accessoires'],
  'tools':           ['safety', 'consumables', 'accessories'],

  // Safety → needs tools, PPE
  'securite':        ['outillage', 'accessoires'],

  // Flooring → needs adhesive, underlay, tools
  'revetement':      ['colle', 'sous-couche', 'outillage', 'joint'],
  'flooring':        ['adhesive', 'underlay', 'tools'],

  // HVAC / Climatisation → needs pipes, tools, refrigerant
  'climatisation':   ['plomberie', 'outillage', 'electricite', 'isolation'],
  'hvac':            ['pipes', 'tools', 'electrical'],

  // Aggregates → needs cement, tools
  'agregats':        ['ciment', 'outillage', 'maconnerie'],
  'aggregates':      ['cement', 'tools'],
};

/**
 * Given a product, return a Mongoose query filter for complementary products.
 * Strategy:
 *  1. Find complementary category names from the map
 *  2. Also match products that share tags with the current product
 *  3. Exclude the current product itself
 */
function buildRecommendationFilter(product, allCategories = []) {
  const categoryName = (product.categoryId?.name || product.categoryId?.slug || '').toLowerCase();
  const categorySlug = (product.categoryId?.slug || '').toLowerCase();

  // Find complementary category names
  const complementaryNames = new Set();
  for (const [key, values] of Object.entries(COMPLEMENTARY_MAP)) {
    if (categoryName.includes(key) || categorySlug.includes(key)) {
      values.forEach(v => complementaryNames.add(v));
    }
  }

  // Find matching category IDs from the full category list
  const complementaryCategoryIds = allCategories
    .filter(cat => {
      const n = (cat.name || '').toLowerCase();
      const s = (cat.slug || '').toLowerCase();
      return [...complementaryNames].some(cn => n.includes(cn) || s.includes(cn));
    })
    .map(cat => cat._id);

  const orClauses = [];

  if (complementaryCategoryIds.length > 0) {
    orClauses.push({ categoryId: { $in: complementaryCategoryIds } });
  }

  // Fallback: if no complementary categories found, return products from other categories
  // that are approved and in stock
  if (orClauses.length === 0) {
    orClauses.push({
      categoryId: { $ne: product.categoryId?._id || product.categoryId },
    });
  }

  return {
    _id: { $ne: product._id },
    isApproved: true,
    stock: { $gt: 0 },
    $or: orClauses,
  };
}

/**
 * Score and sort recommendations:
 * - Products from complementary categories score higher
 * - Higher rated products score higher
 * - More stock = slight boost
 */
function scoreRecommendations(products, product) {
  const categoryName = (product.categoryId?.name || '').toLowerCase();

  return products
    .map(p => {
      let score = 0;
      const pCatName = (p.categoryId?.name || '').toLowerCase();

      // Complementary category match
      for (const [key, values] of Object.entries(COMPLEMENTARY_MAP)) {
        if (categoryName.includes(key)) {
          if (values.some(v => pCatName.includes(v))) score += 10;
        }
      }

      // Rating boost
      score += (p.rating || 0) * 2;

      // Stock availability boost
      if (p.stock > 10) score += 2;
      if (p.stock > 50) score += 1;

      return { ...p, _score: score };
    })
    .sort((a, b) => b._score - a._score);
}

module.exports = { buildRecommendationFilter, scoreRecommendations };
