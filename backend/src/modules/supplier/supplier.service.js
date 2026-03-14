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

  if (data.category && typeof data.category === 'string') {
    console.log('3. Processing category:', data.category);
    let cat;
    
    // Check if the category value is a valid MongoDB ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(data.category);
    console.log('4. Is valid ObjectId?', isValidObjectId);
    
    if (isValidObjectId) {
      // Try to find by ID if it's a valid ObjectId
      cat = await Category.findById(data.category);
      console.log('5. Category found by ID:', cat ? cat.name : 'Not found');
    }
    
    // If not found by ID or not a valid ObjectId, try to find by name
    if (!cat) {
      cat = await Category.findOne({ 
        name: { $regex: new RegExp('^' + data.category + '$', 'i') } 
      });
      console.log('6. Category found by name:', cat ? cat.name : 'Not found');
    }
    
    if (!cat) {
      console.error('❌ Invalid category:', data.category);
      throw new Error('Invalid category');
    }
    data.categoryId = cat._id;
    console.log('7. Set categoryId to:', cat._id);
    delete data.category;
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
const updateProduct = async (id, data, supplierId) => {
  if (data.category && typeof data.category === 'string') {
    let cat;
    
    // Check if the category value is a valid MongoDB ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(data.category);
    
    if (isValidObjectId) {
      // Try to find by ID if it's a valid ObjectId
      cat = await Category.findById(data.category);
    }
    
    // If not found by ID or not a valid ObjectId, try to find by name
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

  const product = await Product.findOneAndUpdate(
    { _id: id, supplierId },
    data,
    { new: true, runValidators: true }
  );
  if (!product) throw new Error('Product not found or unauthorized');
  await product.populate('categoryId', 'name slug');
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