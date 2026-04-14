const supplierService = require('./supplier.service');
const apiResponse = require('../../utils/apiResponse');
const { uploadBufferToCloudinary } = require('../../config/cloudinary');

function validateCreateProductPayload(payload = {}) {
  const errors = {};

  const name = String(payload.name ?? '').trim();
  const description = String(payload.description ?? '').trim();

  const priceRaw = payload.price;
  const stockRaw = payload.stock;

  const price = typeof priceRaw === 'number' ? priceRaw : Number(String(priceRaw ?? '').trim());
  const stockNum = typeof stockRaw === 'number' ? stockRaw : Number(String(stockRaw ?? '').trim());

  if (!name) errors.name = 'Le nom est requis';
  else if (name.length < 2) errors.name = 'Le nom doit contenir au moins 2 caractères';

  if (priceRaw === undefined || priceRaw === null || String(priceRaw).trim() === '') {
    errors.price = 'Le prix est requis';
  } else if (!Number.isFinite(price)) {
    errors.price = 'Le prix doit être un nombre';
  } else if (price <= 0) {
    errors.price = 'Le prix doit être supérieur à 0';
  }

  if (stockRaw === undefined || stockRaw === null || String(stockRaw).trim() === '') {
    errors.stock = 'Le stock est requis';
  } else if (!Number.isFinite(stockNum) || !Number.isInteger(stockNum)) {
    errors.stock = 'Le stock doit être un entier';
  } else if (stockNum < 0) {
    errors.stock = 'Le stock doit être supérieur ou égal à 0';
  }

  if (!description) errors.description = 'La description est requise';
  else if (description.length < 10) errors.description = 'La description doit contenir au moins 10 caractères';

  const categoryId = String(payload.categoryId ?? '').trim();
  const newCategory = String(payload.newCategory ?? '').trim();
  if (!categoryId && !newCategory) {
    errors.category = 'La catégorie est requise';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      name,
      description,
      price,
      stock: stockNum,
      categoryId: categoryId || undefined,
      newCategory: newCategory || undefined,
    }
  };
}

async function uploadProductAssets(files = []) {
  const uploadedImages = [];
  const uploadedDocs = [];

  for (const file of files) {
    const isImage = Boolean(file.mimetype && file.mimetype.startsWith('image/'));
    const uploaded = await uploadBufferToCloudinary(file.buffer, {
      folder: isImage ? 'bmp/products/images' : 'bmp/products/docs',
      resourceType: isImage ? 'image' : 'raw',
    });

    if (isImage) {
      uploadedImages.push(uploaded.secure_url);
    } else {
      uploadedDocs.push(uploaded.secure_url);
    }
  }

  return { uploadedImages, uploadedDocs };
}

const getMyProducts = async (req, res) => {
  try {
    const { page, limit, search, category } = req.query;
    const products = await supplierService.getMyProducts(req.user._id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search: search || '',
      category: category || ''
    });
    apiResponse(res, 'Produits récupérés', products);
  } catch (error) {
    apiResponse(res, error.message || 'Impossible de récupérer les produits', null, 400);
  }
};

const createProduct = async (req, res) => {
  try {
    const data = req.body;
    const files = req.files || [];
    const { uploadedImages, uploadedDocs } = await uploadProductAssets(files);

    let parsedData = {};
    try {
      parsedData = JSON.parse(data.data || '{}');
    } catch {
      return res.status(400).json({
        errors: { data: 'Payload invalide' }
      });
    }

    const { ok, errors, sanitized } = validateCreateProductPayload(parsedData);
    if (!ok) {
      return res.status(400).json({ errors });
    }

    const productData = {
      ...parsedData,
      ...sanitized,
      imageUrls: uploadedImages,
      documentation: uploadedDocs,
    };

    const product = await supplierService.createProduct(productData, req.user._id);
    apiResponse(res, 'Produit créé avec succès', product, 201);
  } catch (error) {
    console.error('Error in createProduct:', error);
    return res.status(400).json({
      errors: { _global: error.message || 'Impossible de créer le produit' }
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    let productData = {};
    if (data.data) {
      productData = JSON.parse(data.data);
    } else {
      productData = data;
    }

    if (req.files && req.files.length > 0) {
      const { uploadedImages, uploadedDocs } = await uploadProductAssets(req.files);
      productData.imageUrls = [...(productData.existingImages || []), ...uploadedImages];
      productData.documentation = [...(productData.existingDocs || []), ...uploadedDocs];
    } else {
      productData.imageUrls = productData.existingImages || [];
      productData.documentation = productData.existingDocs || [];
    }

    delete productData.existingImages;
    delete productData.existingDocs;

    const product = await supplierService.updateProduct(id, productData, req.user._id);
    apiResponse(res, 'Produit mis à jour', product);
  } catch (error) {
    console.error('Update error:', error);
    apiResponse(res, error.message, null, 400);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await supplierService.deleteProduct(id, req.user._id);
    apiResponse(res, 'Produit supprimé');
  } catch (error) {
    apiResponse(res, error.message, null, 400);
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await supplierService.getCategories();
    apiResponse(res, 'Catégories récupérées', categories);
  } catch (error) {
    apiResponse(res, error.message, null, 400);
  }
};

const getStats = async (req, res) => {
  try {
    const stats = await supplierService.getStats(req.user._id);
    apiResponse(res, 'Statistiques récupérées', stats);
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
