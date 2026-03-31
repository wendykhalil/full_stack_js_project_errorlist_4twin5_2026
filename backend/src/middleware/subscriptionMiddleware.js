const Subscription = require('../models/Subscription');

async function requireActiveSubscription(req, res, next) {
  try {
    const sub = await Subscription.findOne({ userId: req.user._id });
    if (!sub || sub.status !== 'ACTIVE' || sub.plan === 'FREE') {
      return res.status(403).json({ message: 'Abonnement actif requis. Veuillez contacter l\'administrateur.' });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = { requireActiveSubscription };