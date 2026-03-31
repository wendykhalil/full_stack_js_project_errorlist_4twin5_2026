const subscriptionService = require('./subscription.service');
const apiResponse = require('../../utils/apiResponse');

async function getMySubscription(req, res) {
  try {
    const subscription = await subscriptionService.getSubscriptionByUser(req.user._id);

    if (!subscription) {
      return apiResponse(res, 'Aucun abonnement', { plan: 'FREE', status: 'ACTIVE' });
    }

    return apiResponse(res, 'Abonnement récupéré', subscription);
  } catch (error) {
    return apiResponse(res, error.message, null, 500);
  }
}

async function authorizeUserSubscription(req, res) {
  try {
    const { userId } = req.params;
    const { plan = 'PRO', status = 'ACTIVE' } = req.body;
    const subscription = await subscriptionService.upsertSubscription(userId, plan, status);
    return apiResponse(res, 'Abonnement mis à jour', subscription);
  } catch (error) {
    return apiResponse(res, error.message, null, 500);
  }
}

module.exports = { getMySubscription, authorizeUserSubscription };
