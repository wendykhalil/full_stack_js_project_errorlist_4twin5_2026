const Favorite = require('../../models/Favorite');
const Cart     = require('../../models/Cart');
const Product  = require('../../models/Product');
const Order    = require('../../models/Order');
const User     = require('../../models/User');
const { notify }               = require('../../utils/notify');
const { notifySupplierNewOrder } = require('../../socket');
const { v4: uuidv4 }           = require('uuid');

// ── helpers ───────────────────────────────────────────────────────────────────

function uid(req) { return req.user._id; }

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = await Cart.create({ userId, items: [] });
  return cart;
}

// ── FAVORITES ─────────────────────────────────────────────────────────────────

async function getFavorites(req, res) {
  try {
    const favs = await Favorite.find({ userId: uid(req) })
      .populate({
        path: 'productId',
        populate: [
          { path: 'categoryId', select: 'name slug' },
          { path: 'supplierId', select: 'companyName firstName lastName' },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    const products = favs
      .filter(f => f.productId)
      .map(f => ({ ...f.productId, favoriteId: f._id }));

    return res.json({ ok: true, products, total: products.length });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function toggleFavorite(req, res) {
  try {
    const { productId } = req.params;
    const existing = await Favorite.findOne({ userId: uid(req), productId });

    if (existing) {
      await existing.deleteOne();
      return res.json({ ok: true, favorited: false });
    }

    // Verify product exists
    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });

    await Favorite.create({ userId: uid(req), productId });
    return res.json({ ok: true, favorited: true });
  } catch (err) {
    if (err.code === 11000) return res.json({ ok: true, favorited: true }); // race condition
    return res.status(500).json({ message: err.message });
  }
}

async function removeFavorite(req, res) {
  try {
    await Favorite.findOneAndDelete({ userId: uid(req), productId: req.params.productId });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── CART ──────────────────────────────────────────────────────────────────────

async function getCart(req, res) {
  try {
    const cart = await Cart.findOne({ userId: uid(req) })
      .populate({
        path: 'items.productId',
        populate: [
          { path: 'categoryId', select: 'name slug' },
          { path: 'supplierId', select: 'companyName firstName lastName' },
        ],
      })
      .lean();

    if (!cart) return res.json({ ok: true, items: [], total: 0, itemCount: 0 });

    const items = cart.items
      .filter(i => i.productId) // skip orphaned items
      .map(i => ({
        _id:           i._id,
        product:       i.productId,
        quantity:      i.quantity,
        priceSnapshot: i.priceSnapshot,
        lineTotal:     Number((i.priceSnapshot * i.quantity).toFixed(2)),
      }));

    const total     = items.reduce((s, i) => s + i.lineTotal, 0);
    const itemCount = items.reduce((s, i) => s + i.quantity, 0);

    return res.json({ ok: true, items, total: Number(total.toFixed(2)), itemCount });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function addToCart(req, res) {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Math.max(1, Math.round(Number(quantity)));

    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    if (!product.isApproved) return res.status(400).json({ message: 'Produit non disponible' });

    const cart = await getOrCreateCart(uid(req));
    const idx  = cart.items.findIndex(i => String(i.productId) === String(productId));

    if (idx >= 0) {
      cart.items[idx].quantity      += qty;
      cart.items[idx].priceSnapshot  = product.price; // refresh price
    } else {
      cart.items.push({ productId, quantity: qty, priceSnapshot: product.price });
    }

    await cart.save();
    return res.json({ ok: true, itemCount: cart.items.reduce((s, i) => s + i.quantity, 0) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function removeFromCart(req, res) {
  try {
    const { productId } = req.body;
    const cart = await Cart.findOne({ userId: uid(req) });
    if (!cart) return res.json({ ok: true });

    cart.items = cart.items.filter(i => String(i.productId) !== String(productId));
    await cart.save();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateQty(req, res) {
  try {
    const { productId, quantity } = req.body;
    const qty = Math.max(1, Math.round(Number(quantity)));

    const cart = await Cart.findOne({ userId: uid(req) });
    if (!cart) return res.status(404).json({ message: 'Panier introuvable' });

    const item = cart.items.find(i => String(i.productId) === String(productId));
    if (!item) return res.status(404).json({ message: 'Produit non trouvé dans le panier' });

    item.quantity = qty;
    await cart.save();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function clearCart(req, res) {
  try {
    await Cart.findOneAndUpdate({ userId: uid(req) }, { $set: { items: [] } });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── BULK CHECKOUT ─────────────────────────────────────────────────────────────

async function checkoutCart(req, res) {
  try {
    const { deliveryAddress, artisanMessage = '' } = req.body;
    const artisanId = uid(req);

    if (!deliveryAddress?.city) {
      return res.status(400).json({ message: 'Adresse de livraison requise (au moins la ville)' });
    }

    const cart = await Cart.findOne({ userId: artisanId })
      .populate('items.productId')
      .lean();

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Votre panier est vide' });
    }

    const artisan    = await User.findById(artisanId).lean();
    const checkoutId = uuidv4(); // groups all orders from this checkout session
    const createdOrders = [];
    const errors        = [];

    for (const item of cart.items) {
      const product = item.productId;
      if (!product) { errors.push({ reason: 'Produit introuvable' }); continue; }
      if (!product.isApproved) { errors.push({ productName: product.name, reason: 'Produit non approuvé' }); continue; }
      if (product.stock < item.quantity) {
        errors.push({ productName: product.name, reason: `Stock insuffisant (${product.stock} disponible)` });
        continue;
      }

      const unitPrice = product.price;
      const lineTotal = Number((unitPrice * item.quantity).toFixed(2));

      const date   = new Date();
      const year   = date.getFullYear().toString().slice(-2);
      const month  = (date.getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

      const order = await Order.create({
        orderNumber:    `CMD-${year}${month}-${random}`,
        productId:      product._id,
        supplierId:     product.supplierId,
        artisanId,
        quantity:       item.quantity,
        unitPrice,
        lineTotal,
        deliveryAddress,
        artisanMessage,
        checkoutId,
        isBulkOrder:    true,
        status:         'PENDING',
        statusHistory:  [{ status: 'PENDING', changedBy: artisanId, note: 'Commande groupée créée' }],
      });

      await order.populate([
        { path: 'productId',  select: 'name price imageUrls' },
        { path: 'supplierId', select: 'firstName lastName email supplierProfile' },
        { path: 'artisanId',  select: 'firstName lastName email phone' },
      ]);

      createdOrders.push(order);

      // Real-time notify supplier
      try {
        const artisanName = `${artisan.firstName || ''} ${artisan.lastName || ''}`.trim() || 'Artisan';
        notifySupplierNewOrder(String(product.supplierId), {
          orderId:     String(order._id),
          orderNumber: order.orderNumber,
          productName: product.name,
          artisanName,
          totalPrice:  lineTotal,
          quantity:    item.quantity,
          status:      'PENDING',
          createdAt:   order.createdAt,
        });
        await notify({
          userId:  product.supplierId,
          type:    'NEW_ORDER',
          title:   'Nouvelle commande reçue',
          message: `${artisanName} a commandé ${item.quantity}× ${product.name} — ${lineTotal.toFixed(2)} TND`,
          link:    `/fournisseur/orders/${order._id}`,
        });
      } catch { /* non-critical */ }
    }

    // Clear cart on success (even partial)
    if (createdOrders.length > 0) {
      await Cart.findOneAndUpdate({ userId: artisanId }, { $set: { items: [] } });
    }

    return res.status(201).json({
      ok:      true,
      checkoutId,
      orders:  createdOrders.map(o => ({ _id: o._id, orderNumber: o.orderNumber, productName: o.productId?.name, lineTotal: o.lineTotal })),
      errors,
      message: `${createdOrders.length} commande(s) créée(s)${errors.length ? `, ${errors.length} erreur(s)` : ''}`,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getFavorites, toggleFavorite, removeFavorite,
  getCart, addToCart, removeFromCart, updateQty, clearCart,
  checkoutCart,
};
