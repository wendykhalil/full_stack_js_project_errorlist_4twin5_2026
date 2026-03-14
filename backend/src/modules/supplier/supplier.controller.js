const supplierService = require('./supplier.service');
const apiResponse = require('../../utils/apiResponse');

// GET /api/supplier/products - list my products
const getMyProducts = async (req, res) => {
  try {
    const { page, limit, search, category } = req.query;
    const products = await supplierService.getMyProducts(req.user._id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search: search || '',
      category: category || ''
    });
    apiResponse(res, 'Products retrieved', products);
  } catch (error) {
    apiResponse(res, error.message, null, 400);
  }
};

// POST /api/supplier/products - create product
// POST /api/supplier/products - create product
const createProduct = async (req, res) => {
  try {
    console.log('=== CONTROLLER DEBUG ===');
    console.log('req.user._id:', req.user?._id);
    
    const data = req.body;
    console.log('Raw req.body:', data);
    
    const files = req.files || [];
    const imageUrls = files.filter(f => f.mimetype.startsWith('image/')).map(f => `/uploads/products/${f.filename}`);
    const docUrls = files.filter(f => f.mimetype === 'application/pdf').map(f => `/uploads/products/${f.filename}`);
    
    const parsedData = JSON.parse(data.data || '{}');
    console.log('Parsed data:', parsedData);
    
    const productData = {
      ...parsedData,
      imageUrls,
      documentation: docUrls
    };
    
    console.log('Final productData:', productData);
    
    const product = await supplierService.createProduct(productData, req.user._id);
    apiResponse(res, 'Product created successfully', product, 201);
  } catch (error) {
    console.error('Error in createProduct:', error);
    apiResponse(res, error.message, null, 400);
  }
};

// PUT /api/supplier/products/:id - update
// PUT /api/supplier/products/:id - update
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // Traiter les données du formulaire
    let productData = {};
    if (data.data) {
      productData = JSON.parse(data.data);
    } else {
      productData = data;
    }
    
    // Traiter les nouveaux fichiers s'ils existent
    if (req.files && req.files.length > 0) {
      const files = req.files;
      const imageUrls = files.filter(f => f.mimetype.startsWith('image/')).map(f => `/uploads/products/${f.filename}`);
      const docUrls = files.filter(f => f.mimetype === 'application/pdf').map(f => `/uploads/products/${f.filename}`);
      
      // Combiner avec les fichiers existants
      productData.imageUrls = [...(productData.existingImages || []), ...imageUrls];
      productData.documentation = [...(productData.existingDocs || []), ...docUrls];
    } else {
      // Si pas de nouveaux fichiers, garder les existants
      productData.imageUrls = productData.existingImages || [];
      productData.documentation = productData.existingDocs || [];
    }
    
    // Nettoyer les champs temporaires
    delete productData.existingImages;
    delete productData.existingDocs;
    
    const product = await supplierService.updateProduct(id, productData, req.user._id);
    apiResponse(res, 'Product updated', product);
  } catch (error) {
    console.error('Update error:', error);
    apiResponse(res, error.message, null, 400);
  }
};

// DELETE /api/supplier/products/:id
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await supplierService.deleteProduct(id, req.user._id);
    apiResponse(res, 'Product deleted');
  } catch (error) {
    apiResponse(res, error.message, null, 400);
  }
};

// GET /api/supplier/categories
const getCategories = async (req, res) => {
  try {
    const categories = await supplierService.getCategories();
    apiResponse(res, 'Categories retrieved', categories);
  } catch (error) {
    apiResponse(res, error.message, null, 400);
  }
};

// GET /api/supplier/stats
const getStats = async (req, res) => {
  try {
    const stats = await supplierService.getStats(req.user._id);
    apiResponse(res, 'Stats retrieved', stats);
  } catch (error) {
    apiResponse(res, error.message, null, 400);
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

