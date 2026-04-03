// Category detection keywords mapping
export const CATEGORY_KEYWORDS = {
  'Ciment': ['ciment', 'cement', 'béton', 'mortier'],
  'Peinture': ['peinture', 'paint', 'enduit', 'vernis'],
  'Carrelage': ['carrelage', 'tile', 'céramique', 'faïence'],
  'Plomberie': ['plomberie', 'tuyau', 'robinet', 'plumbing'],
  'Électricité': ['électricité', 'câble', 'disjoncteur', 'electrical', 'lampe', 'led'],
  'Bois': ['bois', 'wood', 'parquet', 'menuiserie'],
  'Isolation': ['isolation', 'isolant', 'laine de roche', 'polystyrène'],
  'Outillage': ['outil', 'tool', 'marteau', 'perceuse'],
  'Éclairage': ['lampe', 'led', 'éclairage', 'lighting'],
  'Chauffage': ['chauffage', 'radiateur', 'heater']
};

export function detectCategory(productName, existingCategories) {
  const lowerName = productName.toLowerCase();
  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lowerName.includes(kw))) {
      const existing = existingCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
      if (existing) return { found: true, categoryId: existing._id, categoryName: existing.name };
      else return { found: false, suggestedName: catName };
    }
  }
  return { found: false, suggestedName: null };
}

// Generate professional description
export function generateDescription(productName, categoryName) {
  return `${productName} est un produit de haute qualité dans la catégorie ${categoryName || 'générale'}. Conçu pour offrir fiabilité et performance, il répond aux besoins des professionnels comme des particuliers.`;
}

// Suggest price and stock based on product name only (categoryName not needed)
export function suggestPriceAndStock(productName) {
  const lowerName = productName.toLowerCase();
  let suggestedPrice = 0;
  let suggestedStock = 0;

  if (lowerName.includes('ciment') || lowerName.includes('cement')) {
    suggestedPrice = 12;
    suggestedStock = 500;
  } else if (lowerName.includes('peinture') || lowerName.includes('paint')) {
    suggestedPrice = 25;
    suggestedStock = 200;
  } else if (lowerName.includes('carrelage') || lowerName.includes('tile')) {
    suggestedPrice = 35;
    suggestedStock = 300;
  } else if (lowerName.includes('lampe') || lowerName.includes('led')) {
    suggestedPrice = 15;
    suggestedStock = 150;
  } else if (lowerName.includes('outil') || lowerName.includes('tool')) {
    suggestedPrice = 20;
    suggestedStock = 100;
  } else {
    suggestedPrice = 10;
    suggestedStock = 50;
  }

  return { price: suggestedPrice, stock: suggestedStock };
}