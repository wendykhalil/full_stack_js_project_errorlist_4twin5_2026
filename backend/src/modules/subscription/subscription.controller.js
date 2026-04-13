const service = require('./subscription.service');
const apiResponse = require('../../utils/apiResponse');

async function getMySubscription(req, res) {
  try {
    const sub = await service.getSubscriptionByUser(req.user._id);
    if (!sub) {
      return apiResponse(res, 'Aucun abonnement', {
        plan: 'FREE', status: 'ACTIVE', features: service.getFeatures('FREE'),
      });
    }
    const data = sub.toObject();
    data.features = service.getFeatures(sub.plan);
    data.daysUntilExpiry = sub.endDate
      ? Math.max(0, Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
      : null;
    return apiResponse(res, 'Abonnement récupéré', data);
  } catch (e) {
    return apiResponse(res, e.message, null, 500);
  }
}

async function cancelMySubscription(req, res) {
  try {
    const sub = await service.cancelSubscription(req.user._id);
    return apiResponse(res, 'Abonnement annulé. Accès maintenu jusqu\'à la fin de la période.', sub);
  } catch (e) {
    return apiResponse(res, e.message, null, e.statusCode || 500);
  }
}

async function startTrial(req, res) {
  try {
    const sub = await service.startTrial(req.user._id);
    return apiResponse(res, 'Essai gratuit de 14 jours activé !', sub);
  } catch (e) {
    return apiResponse(res, e.message, null, e.statusCode || 500);
  }
}

async function authorizeUserSubscription(req, res) {
  try {
    const { userId } = req.params;
    const { plan = 'PRO', status = 'ACTIVE' } = req.body;
    const sub = await service.upsertSubscription(userId, plan, status, 'Admin authorized');
    return apiResponse(res, 'Abonnement mis à jour', sub);
  } catch (e) {
    return apiResponse(res, e.message, null, 500);
  }
}

async function getPublicPlan(req, res) {
  try {
    const sub = await service.getSubscriptionByUser(req.params.userId);
    const plan = sub?.status === 'ACTIVE' ? (sub?.plan || 'FREE') : 'FREE';
    return apiResponse(res, 'Plan récupéré', { plan });
  } catch (e) {
    return apiResponse(res, 'FREE', { plan: 'FREE' });
  }
}

module.exports = { getMySubscription, getPublicPlan, cancelMySubscription, startTrial, authorizeUserSubscription };
