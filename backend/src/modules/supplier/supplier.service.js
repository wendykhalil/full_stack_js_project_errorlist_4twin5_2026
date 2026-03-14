const Product = require('../../models/Product');
const Category = require('../../models/Category');
const Order = require('../../models/Order');
const SupplierProfile = require('../../models/SupplierProfile');

// Get supplier's own products
const getMyProducts = async (supplierId, { page = 1, limit = 10, search = '', category = '' }) => {
  const query = { supplierId };
  
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

// Create product
// Create product
// Create product
const createProduct = async (data, supplierId) => {
  console.log('=== CREATE PRODUCT DEBUG ===');
  console.log('1. Received supplierId:', supplierId);
  console.log('2. Received data:', JSON.stringify(data, null, 2));
  
  if (!supplierId) {
    console.error('❌ supplierId is missing!');
    throw new Error('Supplier ID is required');
  }

  // Vérifier si c'est une nouvelle catégorie
if (data.newCategory && typeof data.newCategory === 'string') {
  console.log('Creating new category:', data.newCategory);
  
  // Créer un slug à partir du nom
  const slug = data.newCategory
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '-');
  
  // Vérifier si la catégorie existe déjà
  let existingCategory = await Category.findOne({ 
    name: { $regex: new RegExp('^' + data.newCategory + '$', 'i') } 
  });
  
  if (existingCategory) {
    console.log('Category already exists:', existingCategory.name);
    data.categoryId = existingCategory._id;
  } else {
    // Créer la nouvelle catégorie
    const newCategory = new Category({
      name: data.newCategory,
      slug: slug
    });
    await newCategory.save();
    console.log('New category created with ID:', newCategory._id);
    data.categoryId = newCategory._id;
  }
  
  delete data.newCategory;
}

  // Create product with supplierId
  const productData = {
    ...data,
    supplierId: supplierId,
    isApproved: true
  };
  
  console.log('8. Final product data to save:', JSON.stringify(productData, null, 2));
  
  const product = new Product(productData);
  await product.save();
  console.log('9. Product saved with ID:', product._id);
  
  await product.populate('categoryId', 'name slug');
  console.log('10. Product populated with category');
  console.log('=== END DEBUG ===');
  
  return product;
};

// Update product (same fix)
// Update product
const updateProduct = async (id, data, supplierId) => {
  console.log('=== UPDATE PRODUCT DEBUG ===');
  console.log('Updating product ID:', id);
  console.log('Update data:', data);
  
  // Vérifier si c'est une nouvelle catégorie
  if (data.newCategory && typeof data.newCategory === 'string') {
    console.log('Creating new category for update:', data.newCategory);
    
    const slug = data.newCategory
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    
    let existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp('^' + data.newCategory + '$', 'i') } 
    });
    
    if (existingCategory) {
      data.categoryId = existingCategory._id;
    } else {
      const newCategory = new Category({
        name: data.newCategory,
        slug: slug
      });
      await newCategory.save();
      data.categoryId = newCategory._id;
    }
    
    delete data.newCategory;
  }
  else if (data.category && typeof data.category === 'string') {
    let cat;
    
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(data.category);
    
    if (isValidObjectId) {
      cat = await Category.findById(data.category);
    }
    
    if (!cat) {
      cat = await Category.findOne({ 
        name: { $regex: new RegExp('^' + data.category + '$', 'i') } 
      });
    }
    
    if (!cat) {
      throw new Error('Invalid category');
    }
    data.categoryId = cat._id;
    delete data.category;
  }

  // Récupérer le produit existant pour conserver les anciens fichiers
  const existingProduct = await Product.findById(id);
  if (!existingProduct) {
    throw new Error('Product not found');
  }

  // Préparer les données de mise à jour
  const updateData = {
    name: data.name || existingProduct.name,
    price: data.price || existingProduct.price,
    stock: data.stock || existingProduct.stock,
    description: data.description || existingProduct.description,
    categoryId: data.categoryId || existingProduct.categoryId,
    // Conserver les anciennes images si de nouvelles ne sont pas fournies
    imageUrls: data.imageUrls || existingProduct.imageUrls,
    documentation: data.documentation || existingProduct.documentation
  };

  const product = await Product.findOneAndUpdate(
    { _id: id, supplierId },
    updateData,
    { new: true, runValidators: true }
  );
  
  if (!product) throw new Error('Product not found or unauthorized');
  await product.populate('categoryId', 'name slug');
  
  console.log('Product updated successfully:', product._id);
  return product;
};

// Delete product
const deleteProduct = async (id, supplierId) => {
  const product = await Product.findOneAndDelete({ _id: id, supplierId });
  if (!product) throw new Error('Product not found or unauthorized');
  return product;
};

// Get supplier stats
const getStats = async (supplierId) => {
  const productsCount = await Product.countDocuments({ supplierId });
  const ordersCount = await Order.countDocuments({ supplierId });
  
  const revenue = await Order.aggregate([
    { $match: { supplierId } },
    { $group: { 
      _id: null,
      total: { $sum: '$totalAmount' } 
    }}
  ]);
  
  return {
    activeProducts: productsCount,
    monthlyOrders: ordersCount,
    revenue: revenue.length > 0 ? revenue[0].total : 0,
    catalogs: 3 // TODO: implement catalogs
  };
};

// Get categories
// Get categories
const getCategories = async () => {
  try {
    const categories = await Category.find().select('_id name slug').sort('name').lean();
    
    // If no categories exist, create default ones in the database
    if (!categories || categories.length === 0) {
      console.log('No categories found, creating default categories...');
      
      const defaultCategories = [
        { name: 'Basic Materials', slug: 'basic-materials' },
        { name: 'Flooring', slug: 'flooring' },
        { name: 'Paint', slug: 'paint' },
        { name: 'Carpentry', slug: 'carpentry' },
        { name: 'Electricity', slug: 'electricity' },
        { name: 'Plumbing', slug: 'plumbing' }
      ];
      
      const createdCategories = await Category.insertMany(defaultCategories);
      return createdCategories;
    }
    
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

module.exports = {
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getStats,
  getCategories
};