const User = require('../../models/User');
const Order = require('../../models/Order');
const Subscription = require('../../models/Subscription');
const Facture = require('../../models/Facture');
const ActivityLog = require('../../models/ActivityLog');
const AuthLog = require('../../models/AuthLog');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';

// ── In-memory cache ───────────────────────────────────────────────────────────
let insightsCache = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 8 * 60 * 1000; // 8 minutes

// ── Aggregate platform metrics (no raw DB records sent to AI) ─────────────────
async function collectMetrics(days = 30) {
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - days + 1);
  periodStart.setHours(0, 0, 0, 0);
  const prevStart = new Date(periodStart);
  prevStart.setDate(prevStart.getDate() - days);

  const [
    totalUsers,
    activeUsers,
    blockedUsers,
    usersByRole,
    totalOrders,
    orderStatusRaw,
    deliveredOrders,
    newUsers,
    prevUsers,
    newOrders,
    prevOrders,
    userGrowthRaw,
    revenueRaw,
    activeSubscriptions,
    totalInvoices,
    paidInvoices,
    recentAuthActions,
    recentActivityActions,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'ACTIVE' }),
    User.countDocuments({ status: 'BLOCKED' }),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.find({ status: 'DELIVERED' }).select('lineTotal').lean(),
    User.countDocuments({ createdAt: { $gte: periodStart } }),
    User.countDocuments({ createdAt: { $gte: prevStart, $lt: periodStart } }),
    Order.countDocuments({ createdAt: { $gte: periodStart } }),
    Order.countDocuments({ createdAt: { $gte: prevStart, $lt: periodStart } }),
    User.aggregate([
      { $match: { createdAt: { $gte: periodStart } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: periodStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, '$lineTotal', 0] } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Subscription.countDocuments({ status: 'ACTIVE' }),
    Facture.countDocuments(),
    Facture.countDocuments({ status: 'PAID' }),
    AuthLog.aggregate([
      { $match: { createdAt: { $gte: periodStart } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
    ]),
    ActivityLog.aggregate([
      { $match: { createdAt: { $gte: periodStart } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const roleCounts = usersByRole.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {});
  const orderStatus = orderStatusRaw.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {});
  const deliveredRevenue = deliveredOrders.reduce((s, o) => s + (Number(o.lineTotal) || 0), 0);
  const totalRevenue = revenueRaw.reduce((s, r) => s + (r.revenue || 0), 0);

  const userGrowthPct = prevUsers > 0
    ? Number((((newUsers - prevUsers) / prevUsers) * 100).toFixed(1))
    : (newUsers > 0 ? 100 : 0);
  const orderGrowthPct = prevOrders > 0
    ? Number((((newOrders - prevOrders) / prevOrders) * 100).toFixed(1))
    : (newOrders > 0 ? 100 : 0);

  const invoicePaymentRate = totalInvoices > 0
    ? Number(((paidInvoices / totalInvoices) * 100).toFixed(1))
    : 0;

  const deliveryRate = totalOrders > 0
    ? Number((((orderStatus.DELIVERED || 0) / totalOrders) * 100).toFixed(1))
    : 0;

  const cancellationRate = totalOrders > 0
    ? Number((((orderStatus.CANCELLED || 0) / totalOrders) * 100).toFixed(1))
    : 0;

  const authActionSummary = recentAuthActions.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {});
  const topActivities = recentActivityActions.map((r) => ({ action: r._id, count: r.count }));

  return {
    period: `${days} days`,
    users: {
      total: totalUsers,
      active: activeUsers,
      blocked: blockedUsers,
      blockRate: totalUsers > 0 ? Number(((blockedUsers / totalUsers) * 100).toFixed(1)) : 0,
      byRole: roleCounts,
      newThisPeriod: newUsers,
      growthPct: userGrowthPct,
    },
    orders: {
      total: totalOrders,
      newThisPeriod: newOrders,
      growthPct: orderGrowthPct,
      statusBreakdown: {
        pending: orderStatus.PENDING || 0,
        accepted: orderStatus.ACCEPTED || 0,
        delivered: orderStatus.DELIVERED || 0,
        cancelled: orderStatus.CANCELLED || 0,
        other: totalOrders - (orderStatus.PENDING || 0) - (orderStatus.ACCEPTED || 0) - (orderStatus.DELIVERED || 0) - (orderStatus.CANCELLED || 0),
      },
      deliveryRate,
      cancellationRate,
    },
    revenue: {
      totalDelivered: Number(deliveredRevenue.toFixed(2)),
      periodRevenue: Number(totalRevenue.toFixed(2)),
      dailySeries: revenueRaw.map((r) => ({ date: r._id, revenue: Number(r.revenue.toFixed(2)), orders: r.orders })),
    },
    userGrowthSeries: userGrowthRaw.map((r) => ({ date: r._id, newUsers: r.count })),
    subscriptions: {
      active: activeSubscriptions,
    },
    invoices: {
      total: totalInvoices,
      paid: paidInvoices,
      paymentRate: invoicePaymentRate,
    },
    authActivity: authActionSummary,
    topActivities,
  };
}

// ── Build AI prompt ───────────────────────────────────────────────────────────
function buildPrompt(metrics) {
  return `You are a business intelligence analyst for a B2B construction platform in Tunisia called BMP.tn.
Analyze the following aggregated platform metrics and produce a JSON report.

METRICS:
${JSON.stringify(metrics, null, 2)}

Respond ONLY with a valid JSON object in this exact structure:
{
  "summary": "2-3 sentence overview of overall platform health",
  "positives": ["list of 3-5 positive trends or strengths"],
  "risks": ["list of 2-4 problems, risks, or concerns"],
  "recommendations": ["list of 3-5 actionable recommendations for the admin"],
  "score": <integer 0-100 representing overall platform health>
}

Rules:
- Be specific and reference actual numbers from the metrics
- Score 80-100 = healthy, 60-79 = moderate, 40-59 = needs attention, below 40 = critical
- Write in English
- Return ONLY the JSON, no markdown, no explanation`;
}

// ── Call Ollama ───────────────────────────────────────────────────────────────
async function callOllama(prompt) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      format: 'json',
      stream: false,
      options: { temperature: 0.3 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed (${response.status})`);
  }

  const data = await response.json();
  const text = data?.response || '';

  // Try to parse JSON from response
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse AI response as JSON');
  }
}

// ── Heuristic fallback (when Ollama is unavailable) ───────────────────────────
function heuristicInsights(metrics) {
  const { users, orders, revenue, invoices } = metrics;
  const positives = [];
  const risks = [];
  const recommendations = [];
  let score = 50;

  if (users.growthPct > 10) { positives.push(`User base growing at ${users.growthPct}% this period`); score += 8; }
  if (users.growthPct > 0) { positives.push(`${users.newThisPeriod} new users registered this period`); score += 3; }
  if (orders.deliveryRate > 70) { positives.push(`Strong delivery rate of ${orders.deliveryRate}%`); score += 7; }
  if (invoices.paymentRate > 60) { positives.push(`Invoice payment rate at ${invoices.paymentRate}%`); score += 5; }
  if (revenue.periodRevenue > 0) { positives.push(`${revenue.periodRevenue.toLocaleString()} TND revenue generated this period`); score += 5; }

  if (users.blockRate > 5) { risks.push(`High block rate: ${users.blockRate}% of users are blocked`); score -= 8; }
  if (orders.cancellationRate > 15) { risks.push(`Elevated cancellation rate at ${orders.cancellationRate}%`); score -= 10; }
  if (users.growthPct < 0) { risks.push(`User growth is negative (${users.growthPct}%)`); score -= 10; }
  if (invoices.paymentRate < 40) { risks.push(`Low invoice payment rate: ${invoices.paymentRate}%`); score -= 8; }

  if (users.blockRate > 3) recommendations.push('Investigate reasons for user blocks and improve onboarding');
  if (orders.cancellationRate > 10) recommendations.push('Analyze order cancellations and improve supplier reliability');
  recommendations.push('Monitor daily user growth to detect churn early');
  recommendations.push('Encourage artisans to complete their profiles to improve platform trust');
  if (invoices.paymentRate < 70) recommendations.push('Send payment reminders for unpaid invoices');

  const clampedScore = Math.min(100, Math.max(0, score));

  return {
    summary: `Platform has ${users.total} total users with ${users.active} active. ${orders.total} orders processed with a ${orders.deliveryRate}% delivery rate and ${revenue.totalDelivered.toLocaleString()} TND in delivered revenue.`,
    positives: positives.length ? positives : ['Platform is operational with active users'],
    risks: risks.length ? risks : ['No critical risks detected at this time'],
    recommendations,
    score: clampedScore,
    source: 'heuristic',
  };
}

// ── Main exported function ────────────────────────────────────────────────────
async function getAiInsights(days = 30, forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && insightsCache && now < cacheExpiresAt) {
    return { ...insightsCache, cached: true };
  }

  const metrics = await collectMetrics(days);
  const prompt = buildPrompt(metrics);

  let report;
  let source = 'ai';

  try {
    report = await callOllama(prompt);
    // Validate shape
    if (!report.summary || !Array.isArray(report.positives) || !Array.isArray(report.risks) || !Array.isArray(report.recommendations) || typeof report.score !== 'number') {
      throw new Error('Incomplete AI response shape');
    }
    report.score = Math.min(100, Math.max(0, Math.round(report.score)));
  } catch (err) {
    console.warn('[AI Insights] Ollama unavailable, using heuristic fallback:', err.message);
    report = heuristicInsights(metrics);
    source = 'heuristic';
  }

  const result = {
    ...report,
    source,
    generatedAt: new Date().toISOString(),
    metrics: {
      period: metrics.period,
      totalUsers: metrics.users.total,
      activeUsers: metrics.users.active,
      userGrowthPct: metrics.users.growthPct,
      totalOrders: metrics.orders.total,
      deliveryRate: metrics.orders.deliveryRate,
      cancellationRate: metrics.orders.cancellationRate,
      deliveredRevenue: metrics.revenue.totalDelivered,
    },
    cached: false,
  };

  insightsCache = result;
  cacheExpiresAt = now + CACHE_TTL_MS;

  return result;
}

module.exports = { getAiInsights };
