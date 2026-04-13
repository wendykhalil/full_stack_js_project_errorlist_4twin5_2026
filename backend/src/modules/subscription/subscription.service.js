const Subscription = require('../../models/Subscription');
const { getPlanFeatures } = require('../../config/subscriptionPlans');

const TRIAL_DAYS = 14;

async function getSubscriptionByUser(userId) {
  const sub = await Subscription.findOne({ userId });
  if (!sub) return null;

  // Auto-expire if endDate passed
  if (sub.endDate && new Date() > sub.endDate && sub.status === 'ACTIVE') {
    sub.status = 'EXPIRED';
    sub.history.push({ plan: sub.plan, status: 'EXPIRED', note: 'Auto-expired' });
    await sub.save();
  }

  // Auto-expire trial
  if (sub.isOnTrial && sub.trialEndsAt && new Date() > sub.trialEndsAt) {
    sub.isOnTrial = false;
    sub.plan = 'FREE';
    sub.status = 'ACTIVE';
    sub.history.push({ plan: 'FREE', status: 'ACTIVE', note: 'Trial ended' });
    await sub.save();
  }

  return sub;
}

async function upsertSubscription(userId, plan = 'FREE', status = 'ACTIVE', note = '') {
  let sub = await Subscription.findOne({ userId });

  const endDate = new Date();
  if (plan === 'PRO') endDate.setFullYear(endDate.getFullYear() + 1);
  else if (plan === 'BASIC') endDate.setMonth(endDate.getMonth() + 1);
  else endDate.setFullYear(endDate.getFullYear() + 10); // FREE never expires

  if (sub) {
    sub.history.push({ plan: sub.plan, status: sub.status, note: note || 'Plan updated' });
    sub.plan = plan;
    sub.status = status;
    sub.startDate = new Date();
    sub.endDate = plan !== 'FREE' ? endDate : null;
    sub.canceledAt = null;
    sub.isOnTrial = false;
    return sub.save();
  }

  return Subscription.create({
    userId, plan, status,
    startDate: new Date(),
    endDate: plan !== 'FREE' ? endDate : null,
    history: [{ plan, status, note: note || 'Created' }],
  });
}

async function cancelSubscription(userId) {
  const sub = await Subscription.findOne({ userId });
  if (!sub) throw Object.assign(new Error('Subscription not found'), { statusCode: 404 });
  if (sub.status !== 'ACTIVE') throw Object.assign(new Error('Subscription is not active'), { statusCode: 400 });

  sub.history.push({ plan: sub.plan, status: sub.status, note: 'Canceled by user' });
  sub.status = 'CANCELED';
  sub.canceledAt = new Date();
  return sub.save();
}

async function startTrial(userId) {
  let sub = await Subscription.findOne({ userId });
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  if (sub) {
    // Only allow trial if never had one
    if (sub.isOnTrial || sub.history.some(h => h.note === 'Trial started')) {
      throw Object.assign(new Error('Trial already used'), { statusCode: 400 });
    }
    sub.history.push({ plan: 'PRO', status: 'ACTIVE', note: 'Trial started' });
    sub.plan = 'PRO';
    sub.status = 'ACTIVE';
    sub.isOnTrial = true;
    sub.trialEndsAt = trialEndsAt;
    sub.startDate = new Date();
    sub.endDate = trialEndsAt;
    return sub.save();
  }

  return Subscription.create({
    userId, plan: 'PRO', status: 'ACTIVE',
    isOnTrial: true, trialEndsAt,
    startDate: new Date(), endDate: trialEndsAt,
    history: [{ plan: 'PRO', status: 'ACTIVE', note: 'Trial started' }],
  });
}

function getFeatures(plan) {
  return getPlanFeatures(plan);
}

module.exports = { getSubscriptionByUser, upsertSubscription, cancelSubscription, startTrial, getFeatures };
