const ordersService = require('./orders.service');
const apiResponse = require('../../utils/apiResponse');

// Artisan : Créer une demande de commande
async function createOrder(req, res) {  // ← Enlève 'next' des paramètres
  try {
    console.log('Creating order with data:', req.body);
    
    const orderData = {
      ...req.body,
      artisanId: req.user._id
    };
    
    const order = await ordersService.createOrder(orderData);
    return apiResponse(res, 'Demande de commande créée avec succès', order, 201);
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(error.statusCode || 500).json({ 
      message: error.message || 'Erreur lors de la création de la commande' 
    });
  }
}

// Artisan : Voir ses commandes
async function getMyOrders(req, res) {
  try {
    const { page, limit, status } = req.query;
    const orders = await ordersService.getOrdersByArtisan(req.user._id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status
    });
    return apiResponse(res, 'Commandes récupérées', orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(error.statusCode || 500).json({ 
      message: error.message || 'Erreur lors du chargement des commandes' 
    });
  }
}

// Fournisseur : Voir les commandes reçues
async function getSupplierOrders(req, res) {
  try {
    const { page, limit, status } = req.query;
    const orders = await ordersService.getOrdersBySupplier(req.user._id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status
    });
    return apiResponse(res, 'Commandes fournisseur récupérées', orders);
  } catch (error) {
    console.error('Error fetching supplier orders:', error);
    return res.status(error.statusCode || 500).json({ 
      message: error.message || 'Erreur lors du chargement des commandes' 
    });
  }
}

// Fournisseur : Mettre à jour le statut d'une commande
async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const order = await ordersService.updateOrderStatus(
      id, 
      req.user._id, 
      status, 
      note
    );
    return apiResponse(res, 'Statut de la commande mis à jour', order);
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(error.statusCode || 500).json({ 
      message: error.message || 'Erreur lors de la mise à jour du statut' 
    });
  }
}

// Fournisseur : Ajouter une note à une commande
async function addSupplierNote(req, res) {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const order = await ordersService.addSupplierNote(id, req.user._id, note);
    return apiResponse(res, 'Note ajoutée', order);
  } catch (error) {
    console.error('Error adding note:', error);
    return res.status(error.statusCode || 500).json({ 
      message: error.message || 'Erreur lors de l\'ajout de la note' 
    });
  }
}

// Artisan ou Fournisseur : Voir une commande spécifique
async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const order = await ordersService.getOrderById(id, req.user._id);
    return apiResponse(res, 'Commande récupérée', order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(error.statusCode || 500).json({ 
      message: error.message || 'Erreur lors du chargement de la commande' 
    });
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getSupplierOrders,
  updateOrderStatus,
  addSupplierNote,
  getOrderById
};