const Order = require('../../models/Order');
const Product = require('../../models/Product');
const User = require('../../models/User');
const { sendNewOrderEmailToSupplier, sendOrderStatusUpdateEmailToArtisan } = require('../../utils/orderEmail');
const { notify } = require('../../utils/notify');
const { notifySupplierNewOrder } = require('../../socket');

// Créer une commande
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

    // Récupérer l'artisan
    const artisan = await User.findById(artisanId);
    if (!artisan) {
      const error = new Error('Artisan non trouvé');
      error.statusCode = 404;
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
      orderNumber,
      productId,
      supplierId: product.supplierId._id,
      artisanId,
      quantity,
      unitPrice,
      lineTotal,
      deliveryAddress,
      artisanMessage,
      status: 'PENDING',
      statusHistory: [{
        status: 'PENDING',
        changedBy: artisanId,
        note: 'Commande créée'
      }]
    });

    await order.save();
    console.log('Order created successfully:', order._id);
    
    // Peupler les références
    await order.populate([
      { path: 'productId', select: 'name price imageUrls' },
      { path: 'supplierId', select: 'firstName lastName email supplierProfile' },
      { path: 'artisanId', select: 'firstName lastName email phone' }
    ]);

    // ✅ ENVOYER EMAIL AU FOURNISSEUR
    try {
      await sendNewOrderEmailToSupplier(
        order,
        product.supplierId,
        artisan,
        product
      );
    } catch (emailError) {
      console.error('Erreur envoi email (non bloquante):', emailError);
      // Ne pas bloquer la création de la commande si l'email échoue
    }

    // ✅ REAL-TIME: notify supplier via Socket.io + persist notification
    try {
      const artisanName = `${artisan.firstName || ''} ${artisan.lastName || ''}`.trim() || 'Artisan';
      const orderPayload = {
        orderId:     String(order._id),
        orderNumber: order.orderNumber,
        productName: product.name,
        artisanName,
        totalPrice:  order.lineTotal,
        quantity:    order.quantity,
        status:      'PENDING',
        createdAt:   order.createdAt,
      };

      // Emit new_order event to supplier's dedicated room
      notifySupplierNewOrder(String(product.supplierId._id), orderPayload);

      // Persist notification + emit notification event (for bell badge)
      await notify({
        userId:  product.supplierId._id,
        type:    'NEW_ORDER',
        title:   'Nouvelle commande reçue',
        message: `${artisanName} a commandé ${order.quantity}× ${product.name} — ${order.lineTotal.toFixed(2)} TND`,
        link:    `/fournisseur/orders/${order._id}`,
      });
    } catch (socketErr) {
      console.error('Erreur notification temps réel (non bloquante):', socketErr.message);
    }

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
// Mettre à jour le statut d'une commande
async function updateOrderStatus(orderId, userId, newStatus, note = '') {
  // Récupérer la commande
  const order = await Order.findById(orderId)
    .populate('productId')
    .populate('supplierId')
    .populate('artisanId');
    
  if (!order) {
    const error = new Error('Commande non trouvée');
    error.statusCode = 404;
    throw error;
  }

  // Vérifier que l'utilisateur est le fournisseur
  if (order.supplierId._id.toString() !== userId.toString()) {
    const error = new Error('Non autorisé');
    error.statusCode = 403;
    throw error;
  }

  // Ancien statut pour référence
  const oldStatus = order.status;

  // Mettre à jour en utilisant updateOne
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
          note: note || `Statut changé de ${oldStatus} à ${newStatus}`
        }
      }
    }
  );

  // Récupérer la commande mise à jour
  const updatedOrder = await Order.findById(orderId)
    .populate('productId')
    .populate('supplierId')
    .populate('artisanId');

  // ✅ ENVOYER EMAIL À L'ARTISAN si le statut est dans la liste
  const statusesToNotify = ['ACCEPTED', 'PREPARING', 'SHIPPED', 'DELIVERED'];
  if (statusesToNotify.includes(newStatus)) {
    try {
      await sendOrderStatusUpdateEmailToArtisan(
        updatedOrder,
        updatedOrder.artisanId,
        updatedOrder.supplierId,
        updatedOrder.productId,
        newStatus
      );
    } catch (emailError) {
      console.error('Erreur envoi email statut (non bloquante):', emailError);
    }
  }

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
  getOrderById,
  submitReview,
};

/**
 * Submit a verified-purchase review for a delivered order.
 * Business rules enforced here:
 *  - caller must be the order's artisan
 *  - order must be DELIVERED
 *  - order must not already have a review
 *  - rating must be 1–5
 * After saving, product rating is recomputed from ALL reviewed orders.
 */
async function submitReview(orderId, artisanId, { rating, comment }) {
  const parsedRating = Number(rating);
  if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    const err = new Error('La note doit être un entier entre 1 et 5');
    err.statusCode = 400;
    throw err;
  }
  const score = Math.round(parsedRating);

  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error('Commande non trouvée');
    err.statusCode = 404;
    throw err;
  }

  if (order.artisanId.toString() !== artisanId.toString()) {
    const err = new Error('Non autorisé — vous n\'êtes pas l\'acheteur de cette commande');
    err.statusCode = 403;
    throw err;
  }

  if (order.status !== 'DELIVERED') {
    const err = new Error('Vous ne pouvez noter qu\'une commande livrée');
    err.statusCode = 400;
    throw err;
  }

  if (order.review?.isReviewed) {
    const err = new Error('Vous avez déjà noté cette commande');
    err.statusCode = 409;
    throw err;
  }

  // Save review on the order
  await Order.updateOne(
    { _id: orderId },
    {
      $set: {
        'review.rating':     score,
        'review.comment':    (comment || '').trim().slice(0, 1000),
        'review.createdAt':  new Date(),
        'review.isReviewed': true,
      },
    }
  );

  // Recompute product rating from ALL reviewed orders (single aggregation)
  const productId = order.productId;
  const [stats] = await Order.aggregate([
    { $match: { productId, 'review.isReviewed': true } },
    {
      $group: {
        _id:       '$productId',
        avgRating: { $avg: '$review.rating' },
        count:     { $sum: 1 },
      },
    },
  ]);

  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        rating:      stats ? Number(stats.avgRating.toFixed(2)) : 0,
        ratingCount: stats ? stats.count : 0,
      },
    }
  );

  // Invalidate ML insights cache for this supplier
  try {
    const product = await Product.findById(productId).select('supplierId').lean();
    if (product?.supplierId) {
      const { cache: insightsCache } = require('../supplier/aiInsights.service');
      if (insightsCache) insightsCache.delete(String(product.supplierId));
    }
  } catch { /* non-critical */ }

  return Order.findById(orderId)
    .populate('productId', 'name price imageUrls rating ratingCount')
    .lean();
}