const Order = require('../../models/Order');
const Product = require('../../models/Product');
const User = require('../../models/User');

// Créer une commande
// Créer une commande
async function createOrder(orderData) {
  try {
    const { productId, quantity, deliveryAddress, artisanMessage, artisanId } = orderData;

    // Vérifier que le produit existe
    const product = await Product.findById(productId).populate('supplierId');
    if (!product) {
      const error = new Error('Produit non trouvé');
      error.statusCode = 404;
      throw error;
    }

    // Vérifier le stock
    if (product.stock < quantity) {
      const error = new Error('Stock insuffisant');
      error.statusCode = 400;
      throw error;
    }

    // Calculer les valeurs
    const unitPrice = product.price;
    const lineTotal = unitPrice * quantity;

    // Générer un numéro de commande
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderNumber = `CMD-${year}${month}-${random}`;

    // Créer la commande
  const order = new Order({
  productId,
  supplierId: product.supplierId._id,
  artisanId,
  quantity,
  unitPrice,
  lineTotal,
  deliveryAddress,
  artisanMessage,
  status: "PENDING"
});

    await order.save();
    console.log('Order created successfully:', order._id);
    
    // Peupler les références
    await order.populate([
      { path: 'productId', select: 'name price imageUrls' },
      { path: 'supplierId', select: 'firstName lastName email supplierProfile' },
      { path: 'artisanId', select: 'firstName lastName email phone' }
    ]);

    return order;
  } catch (error) {
    console.error('Error in createOrder service:', error);
    throw error;
  }
}

// Récupérer les commandes d'un artisan
async function getOrdersByArtisan(artisanId, { page, limit, status }) {
  const query = { artisanId };
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  
  const orders = await Order.find(query)
    .populate('productId', 'name price imageUrls')
    .populate('supplierId', 'firstName lastName email supplierProfile')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Order.countDocuments(query);

  return {
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

// Récupérer les commandes d'un fournisseur
async function getOrdersBySupplier(supplierId, { page, limit, status }) {
  const query = { supplierId };
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  
  const orders = await Order.find(query)
    .populate('productId', 'name price imageUrls documentation technicalSheet')
    .populate('artisanId', 'firstName lastName email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Order.countDocuments(query);

  return {
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

// Mettre à jour le statut d'une commande
// Mettre à jour le statut d'une commande
async function updateOrderStatus(orderId, userId, newStatus, note = '') {
  // Récupérer la commande sans validation
  const order = await Order.findById(orderId).lean(); // ← Utilise lean() pour éviter la validation
  if (!order) {
    const error = new Error('Commande non trouvée');
    error.statusCode = 404;
    throw error;
  }

  // Vérifier que l'utilisateur est le fournisseur
  if (order.supplierId.toString() !== userId.toString()) {
    const error = new Error('Non autorisé');
    error.statusCode = 403;
    throw error;
  }

  // Mettre à jour en utilisant updateOne pour éviter la validation
  await Order.updateOne(
    { _id: orderId },
    {
      $set: { 
        status: newStatus,
        ...(newStatus === 'ACCEPTED' && { acceptedDate: new Date() }),
        ...(newStatus === 'REFUSED' && { refusedDate: new Date() }),
        ...(newStatus === 'SHIPPED' && { shippedDate: new Date() }),
        ...(newStatus === 'DELIVERED' && { deliveredDate: new Date() })
      },
      $push: {
        statusHistory: {
          status: newStatus,
          changedBy: userId,
          note: note || ''
        }
      }
    }
  );

  // Récupérer la commande mise à jour
  const updatedOrder = await Order.findById(orderId)
    .populate('productId', 'name price imageUrls')
    .populate('supplierId', 'firstName lastName email supplierProfile')
    .populate('artisanId', 'firstName lastName email phone');

  return updatedOrder;
}

// Ajouter une note fournisseur
async function addSupplierNote(orderId, supplierId, note) {
  const order = await Order.findById(orderId).lean();
  if (!order) {
    const error = new Error('Commande non trouvée');
    error.statusCode = 404;
    throw error;
  }

  if (order.supplierId.toString() !== supplierId.toString()) {
    const error = new Error('Non autorisé');
    error.statusCode = 403;
    throw error;
  }

  await Order.updateOne(
    { _id: orderId },
    { $set: { supplierNotes: note } }
  );

  const updatedOrder = await Order.findById(orderId)
    .populate('productId', 'name price imageUrls')
    .populate('supplierId', 'firstName lastName email supplierProfile')
    .populate('artisanId', 'firstName lastName email phone');

  return updatedOrder;
}

// Ajouter une note fournisseur
async function addSupplierNote(orderId, supplierId, note) {
  const order = await Order.findById(orderId);
  if (!order) {
    const error = new Error('Commande non trouvée');
    error.statusCode = 404;
    throw error;
  }

  if (order.supplierId.toString() !== supplierId.toString()) {
    const error = new Error('Non autorisé');
    error.statusCode = 403;
    throw error;
  }

  order.supplierNotes = note;
  await order.save();
  
  return order;
}

// Récupérer une commande par ID
async function getOrderById(orderId, userId) {
  const order = await Order.findById(orderId)
    .populate('productId')
    .populate('supplierId', 'firstName lastName email supplierProfile')
    .populate('artisanId', 'firstName lastName email phone')
    .populate('statusHistory.changedBy', 'firstName lastName');

  if (!order) {
    const error = new Error('Commande non trouvée');
    error.statusCode = 404;
    throw error;
  }

  // Vérifier que l'utilisateur est soit l'artisan soit le fournisseur
  if (order.artisanId._id.toString() !== userId.toString() && 
      order.supplierId._id.toString() !== userId.toString()) {
    const error = new Error('Non autorisé');
    error.statusCode = 403;
    throw error;
  }

  return order;
}
// Récupérer les commandes en cours d'un artisan
// Récupérer les commandes en cours d'un artisan
async function getArtisanActiveOrders(artisanId, { page = 1, limit = 10 }) {
  const query = { 
    artisanId,
    status: { $in: ['PENDING', 'ACCEPTED', 'PREPARING', 'SHIPPED'] }
  };

  const skip = (page - 1) * limit;
  
  const orders = await Order.find(query)
    .populate('productId', 'name price imageUrls')
    .populate('supplierId', 'firstName lastName email supplierProfile')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Order.countDocuments(query);

  return {
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

// Récupérer l'historique des commandes d'un artisan
async function getArtisanOrderHistory(artisanId, { page = 1, limit = 10 }) {
  const query = { 
    artisanId,
    status: { $in: ['DELIVERED', 'CANCELLED'] }
  };

  const skip = (page - 1) * limit;
  
  const orders = await Order.find(query)
    .populate('productId', 'name price imageUrls')
    .populate('supplierId', 'firstName lastName email supplierProfile')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Order.countDocuments(query);

  return {
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

// Récupérer les commandes en cours d'un fournisseur
async function getSupplierActiveOrders(supplierId, { page = 1, limit = 10 }) {
  const query = { 
    supplierId,
    status: { $in: ['PENDING', 'ACCEPTED', 'PREPARING', 'SHIPPED'] }
  };

  const skip = (page - 1) * limit;
  
  const orders = await Order.find(query)
    .populate('productId', 'name price imageUrls documentation technicalSheet')
    .populate('artisanId', 'firstName lastName email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Order.countDocuments(query);

  return {
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

// Récupérer l'historique des commandes d'un fournisseur
async function getSupplierOrderHistory(supplierId, { page = 1, limit = 10 }) {
  const query = { 
    supplierId,
    status: { $in: ['DELIVERED', 'CANCELLED'] }
  };

  const skip = (page - 1) * limit;
  
  const orders = await Order.find(query)
    .populate('productId', 'name price imageUrls documentation technicalSheet')
    .populate('artisanId', 'firstName lastName email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Order.countDocuments(query);

  return {
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

// Récupérer l'historique des commandes d'un artisan
async function getArtisanOrderHistory(artisanId, { page = 1, limit = 10 }) {
  const query = { 
    artisanId,
    status: { $in: ['DELIVERED', 'CANCELLED'] }
  };

  const skip = (page - 1) * limit;
  
  const orders = await Order.find(query)
    .populate('productId', 'name price imageUrls')
    .populate('supplierId', 'firstName lastName email supplierProfile')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Order.countDocuments(query);

  return {
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

// Récupérer les commandes en cours d'un fournisseur
async function getSupplierActiveOrders(supplierId, { page = 1, limit = 10 }) {
  const query = { 
    supplierId,
    status: { $in: ['PENDING', 'ACCEPTED', 'PREPARING', 'SHIPPED'] }
  };

  const skip = (page - 1) * limit;
  
  const orders = await Order.find(query)
    .populate('productId', 'name price imageUrls documentation technicalSheet')
    .populate('artisanId', 'firstName lastName email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Order.countDocuments(query);

  return {
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

// Récupérer l'historique des commandes d'un fournisseur
async function getSupplierOrderHistory(supplierId, { page = 1, limit = 10 }) {
  const query = { 
    supplierId,
    status: { $in: ['DELIVERED', 'CANCELLED'] }
  };

  const skip = (page - 1) * limit;
  
  const orders = await Order.find(query)
    .populate('productId', 'name price imageUrls documentation technicalSheet')
    .populate('artisanId', 'firstName lastName email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Order.countDocuments(query);

  return {
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
}

module.exports = {
  createOrder,
  getOrdersByArtisan,
  getOrdersBySupplier,
  updateOrderStatus,
  addSupplierNote,
  getOrderById
};