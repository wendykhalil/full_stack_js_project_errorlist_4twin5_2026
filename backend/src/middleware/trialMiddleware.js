const Subscription = require('../models/Subscription');
const ArtisanProfile = require('../models/ArtisanProfile');

/**
 * Middleware that allows one free trial for artisans without active subscription
 * @param {string} featureKey - The feature key from trialFeatures (e.g., 'projectCreated', 'portfolioCreated')
 * @returns {Function} Express middleware function
 */
function allowOneTrialOrActiveSubscription(featureKey) {
  return async (req, res, next) => {
    try {
      // Check if user has active subscription
      const subscription = await Subscription.findOne({ userId: req.user._id });
      
      if (subscription && subscription.status === 'ACTIVE' && subscription.plan !== 'FREE') {
        // User has active paid subscription, allow access
        return next();
      }

      // User doesn't have active subscription, check trial status
      let artisanProfile = await ArtisanProfile.findOne({ userId: req.user._id });
      
      if (!artisanProfile) {
        return res.status(404).json({ 
          message: 'Profil artisan non trouvé' 
        });
      }

      // Initialize trialFeatures if it doesn't exist (for existing profiles)
      if (!artisanProfile.trialFeatures) {
        artisanProfile.trialFeatures = {
          projectCreated: false,
          portfolioCreated: false,
          quoteCreated: false,
          invoiceCreated: false
        };
      }

      // Check if trial feature has already been used
      if (artisanProfile.trialFeatures[featureKey]) {
        return res.status(403).json({ 
          message: `Vous avez déjà utilisé votre essai gratuit pour cette fonctionnalité. Veuillez vous abonner pour continuer.`,
          requiresSubscription: true,
          featureName: featureKey
        });
      }

      // First-time trial attempt - mark as used before proceeding
      artisanProfile.trialFeatures[featureKey] = true;
      await artisanProfile.save();

      // Attach trial info to request for response
      req.isTrialAttempt = true;
      req.featureKey = featureKey;

      return next();
    } catch (error) {
      console.error('Trial middleware error:', error);
      return res.status(500).json({ message: error.message });
    }
  };
}

module.exports = { allowOneTrialOrActiveSubscription };
