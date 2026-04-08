const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Créer une intention de paiement
router.post('/create-payment-intent', express.json(), async (req, res) => {
  try {
    const { amount, plan, userId } = req.body;

    console.log('📦 Création paiement:', { amount, plan, userId });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'eur',
      metadata: {
        userId: userId || 'unknown',
        plan: plan || 'unknown',
      }
    });

    console.log('✅ PaymentIntent créé:', paymentIntent.id);
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('❌ Erreur Stripe:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Activer l'abonnement après paiement réussi
router.post('/activate-subscription', express.json(), async (req, res) => {
  try {
    const { plan, paymentIntentId, status } = req.body;
    const userId = req.user?.id || req.user?._id || 'unknown';

    console.log('📦 Activation reçue:', { plan, paymentIntentId, userId, status });

    // TODO: Ajouter la logique de sauvegarde en base de données ici
    
    res.json({ 
      success: true, 
      message: `Abonnement ${plan} activé avec succès`,
      plan: plan,
      paymentIntentId: paymentIntentId,
      activatedAt: new Date()
    });
  } catch (error) {
    console.error('❌ Erreur activation:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;