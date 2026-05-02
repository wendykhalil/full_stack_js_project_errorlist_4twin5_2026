const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { authRequired } = require('../middleware/authMiddleware');
const { upsertSubscription } = require('../modules/subscription/subscription.service');
const PromoCode = require('../models/PromoCode');

// Lazy initialization - only create stripe instance when needed
let stripe;
function getStripe() {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

// Create payment intent
router.post('/create-payment-intent', express.json(), authRequired, async (req, res) => {
  try {
    const { amount, plan } = req.body;
    const userId = String(req.user._id);

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'eur',
      metadata: { userId, plan: plan || 'unknown' },
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activate subscription after successful payment
router.post('/activate-subscription', express.json(), authRequired, async (req, res) => {
  try {
    const { plan, paymentIntentId } = req.body;
    const userId = String(req.user._id);

    console.log('🔔 activate-subscription called:', { plan, paymentIntentId, userId });

    if (!plan || !['monthly', 'yearly', 'BASIC', 'PRO'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan: ' + plan });
    }

    // Map frontend plan names to DB enum
    const planMap = { monthly: 'BASIC', yearly: 'PRO', BASIC: 'BASIC', PRO: 'PRO' };
    const dbPlan = planMap[plan] || 'BASIC';

    // Calculate end date
    const endDate = new Date();
    if (plan === 'yearly' || plan === 'PRO') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const subscription = await upsertSubscription(userId, dbPlan, 'ACTIVE', 'Payment via Stripe');
    subscription.endDate = endDate;
    await subscription.save();

    // Increment promo code usage if one was applied
    if (req.body.promoCode) {
      await PromoCode.findOneAndUpdate(
        { code: req.body.promoCode.toUpperCase().trim() },
        { $inc: { usedCount: 1 } }
      );
    }

    console.log('✅ Subscription activated:', { userId, dbPlan, endDate });
    res.json({ success: true, subscription });
  } catch (error) {
    console.error('❌ Activation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook (for production reliability)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const { userId, plan } = intent.metadata || {};
    if (userId && plan) {
      const planMap = { monthly: 'BASIC', yearly: 'PRO', BASIC: 'BASIC', PRO: 'PRO' };
      const dbPlan = planMap[plan] || 'BASIC';
      const endDate = new Date();
      plan === 'yearly' || plan === 'PRO'
        ? endDate.setFullYear(endDate.getFullYear() + 1)
        : endDate.setMonth(endDate.getMonth() + 1);
      const sub = await upsertSubscription(userId, dbPlan, 'ACTIVE');
      sub.endDate = endDate;
      await sub.save();
    }
  }

  res.json({ received: true });
});

module.exports = router;