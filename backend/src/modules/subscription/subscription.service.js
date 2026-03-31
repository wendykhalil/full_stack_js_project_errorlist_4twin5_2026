const Subscription = require('../../models/Subscription');

async function getSubscriptionByUser(userId) {
  return Subscription.findOne({ userId });
}

async function upsertSubscription(userId, plan = 'FREE', status = 'ACTIVE') {
  const sub = await Subscription.findOne({ userId });
  if (sub) {
    sub.plan = plan;
    sub.status = status;
    if (!sub.startDate) sub.startDate = new Date();
    return sub.save();
  }

  return Subscription.create({ userId, plan, status, startDate: new Date() });
}

module.exports = { getSubscriptionByUser, upsertSubscription };
