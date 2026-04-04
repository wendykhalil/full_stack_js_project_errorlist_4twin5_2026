const supplierService = require('./supplier.service');
const apiResponse = require('../../utils/apiResponse');
const { uploadBufferToCloudinary } = require('../../config/cloudinary');

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
    apiResponse(res, 'Products retrieved', products);
  } catch (error) {
    apiResponse(res, error.message, null, 400);
  }
};

const createProduct = async (req, res) => {
  try {
    const data = req.body;
    const files = req.files || [];
    const { uploadedImages, uploadedDocs } = await uploadProductAssets(files);

    const parsedData = JSON.parse(data.data || '{}');
    const productData = {
      ...parsedData,
      imageUrls: uploadedImages,
      documentation: uploadedDocs,
    };

    const product = await supplierService.createProduct(productData, req.user._id);
    apiResponse(res, 'Product created successfully', product, 201);
  } catch (error) {
    console.error('Error in createProduct:', error);
    apiResponse(res, error.message, null, 400);
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
    apiResponse(res, 'Product updated', product);
  } catch (error) {
    console.error('Update error:', error);
    apiResponse(res, error.message, null, 400);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await supplierService.deleteProduct(id, req.user._id);
    apiResponse(res, 'Product deleted');
  } catch (error) {
    apiResponse(res, error.message, null, 400);
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await supplierService.getCategories();
    apiResponse(res, 'Categories retrieved', categories);
  } catch (error) {
    apiResponse(res, error.message, null, 400);
  }
};

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
