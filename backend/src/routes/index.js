const express = require('express');

const { getAiInsights } = require('../modules/admin/aiInsights.service');
const authRoutes = require('../modules/auth/auth.routes');
const projectsRoutes = require('../modules/projects/projects.routes');
const supplierRoutes = require('../modules/supplier/supplier.routes');
const catalogRoutes = require('../modules/catalog/catalog.routes');
const ordersRoutes = require('../modules/orders/orders.routes');
const messagesRoutes = require('../modules/messages/messages.routes');
const documentsRoutes = require('../modules/documents/documents.routes');
const aiRoutes = require('../modules/ai-assistant/ai.routes');
const messageActionsRoutes = require('../../routes/messageActions');

// ✅ NOUVEAUX IMPORTS
const artisanProfileRoutes = require('../modules/artisan/artisanProfile.routes');
const portfolioRoutes = require('../modules/artisan/portfolio.routes');
const searchRoutes = require('../modules/search/search.routes');
const subscriptionRoutes = require('../modules/subscription/subscription.routes');
const weatherRoutes = require('../modules/weather/weather.routes');
const serviceRequestsRoutes = require('../modules/service-requests/serviceRequests.routes');
const reviewsRoutes = require('../modules/reviews/reviews.routes');
const promoRoutes = require('../modules/promo/promo.routes');
const availabilityRoutes = require('../modules/availability/availability.routes');
const notificationsRoutes = require('../modules/notifications/notifications.routes');
const reportsRoutes = require('../modules/reports/reports.routes');
const disputesRoutes = require('../modules/disputes/disputes.routes');
const marketplaceRoutes   = require('../modules/marketplace/marketplace.routes');
const meetingsRoutes = require('../modules/meetings/meetings.routes');

const { authRequired } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const AuthLog = require('../models/AuthLog');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const Product = require('../models/Product');
const Project = require('../models/Project');
const Order = require('../models/Order');
const Devis = require('../models/Devis');
const productRoutes = require("./products.routes");
const Facture = require('../models/Facture');
const Subscription = require('../models/Subscription');
const { notifyAdmins } = require('../socket');

// ✅ Créer le router APRÈS tous les imports
const router = express.Router();


function deriveProjectProgress(project, projectQuotes = [], projectInvoices = []) {
  const status = project?.status;
  if (status === 'COMPLETED') {
    return { progress: 100, label: 'Projet cloture' };
  }

  let score = status === 'ACTIVE' ? 18 : 8;
  let label = status === 'ACTIVE' ? 'Travaux en cours' : 'Projet en preparation';

  const start = project?.startDate ? new Date(project.startDate) : null;
  const end = project?.endDate ? new Date(project.endDate) : null;
  const now = new Date();

  if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start) {
    const total = end.getTime() - start.getTime();
    const elapsed = Math.min(Math.max(now.getTime() - start.getTime(), 0), total);
    const scheduleRatio = elapsed / total;
    score += Math.round(scheduleRatio * 40);

    if (now < start) {
      label = 'Demarrage planifie';
    } else if (scheduleRatio < 0.35) {
      label = 'Debut de chantier';
    } else if (scheduleRatio < 0.75) {
      label = 'Travaux en cours';
    } else {
      label = 'Finition du chantier';
    }
  } else if (status === 'ACTIVE') {
    score += 10;
  }

  const hasDraftQuote = projectQuotes.some((item) => item.status === 'DRAFT');
  const hasSentQuote = projectQuotes.some((item) => item.status === 'SENT');
  const hasAcceptedQuote = projectQuotes.some((item) => item.status === 'ACCEPTED');

  if (projectQuotes.length) {
    score += 8;
    if (hasAcceptedQuote) {
      score += 14;
      label = 'Devis accepte';
    } else if (hasSentQuote) {
      score += 10;
      label = 'Devis envoye';
    } else if (hasDraftQuote) {
      score += 4;
      label = 'Devis en preparation';
    }
  }

  const hasDraftInvoice = projectInvoices.some((item) => item.status === 'DRAFT');
  const hasSentInvoice = projectInvoices.some((item) => item.status === 'SENT');
  const hasPaidInvoice = projectInvoices.some((item) => item.status === 'PAID');

  if (projectInvoices.length) {
    score += 10;
    if (hasPaidInvoice) {
      score += 25;
      label = 'Facture payee';
    } else if (hasSentInvoice) {
      score += 18;
      label = 'Facturation envoyee';
    } else if (hasDraftInvoice) {
      score += 8;
      label = 'Facturation preparee';
    }
  }

  if (status === 'PENDING') {
    score = Math.min(score, 48);
  }

  if (status === 'ACTIVE') {
    score = Math.max(score, 22);
  }

  return { progress: Math.max(6, Math.min(95, Math.round(score))), label };
}

function formatRelativeDate(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
  if (diffHours < 24) return `il y a ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return 'hier';
  if (diffDays < 30) return `il y a ${diffDays} j`;
  const diffMonths = Math.round(diffDays / 30);
  return `il y a ${diffMonths} mois`;
}

async function auditAdminAction(req, action, details = {}) {
  try {
    await ActivityLog.create({
      user: req.user?._id,
      action,
      details,
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      country: String(req.headers['x-client-country'] || ''),
      countryCode: String(req.headers['x-client-country-code'] || ''),
    });
  } catch (_) {
    // do not fail request because of logging
  }
}


router.get('/health', (req, res) => res.json({ ok: true }));

router.post('/users/update-location', authRequired, requireRoles('ARTISAN'), async (req, res, next) => {
  try {
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'Latitude/longitude invalides' });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'Coordonnées hors limites' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          location: {
            lat,
            lng,
            updatedAt: new Date(),
          },
        },
      },
      {
        new: true,
        runValidators: true,
        select: '-password',
      }
    );

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    res.json({
      ok: true,
      message: 'Position mise à jour',
      user,
    });
  } catch (err) {
    next(err);
  }
});

router.use('/auth', authRoutes);
router.use('/projects', projectsRoutes);
router.use('/supplier', supplierRoutes);
router.use('/catalog', catalogRoutes);
router.use('/orders', ordersRoutes);
router.use('/messages', messagesRoutes);
router.use('/messages', messageActionsRoutes);
router.use('/documents', documentsRoutes);
router.use('/ai', aiRoutes);


// ✅ NOUVELLES ROUTES
router.use('/artisan/profile', artisanProfileRoutes);
router.use('/artisan/portfolio', portfolioRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/search', searchRoutes);
router.use('/weather', weatherRoutes);
router.use('/service-requests', serviceRequestsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/promo', promoRoutes);
router.use('/availability', availabilityRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/reports', reportsRoutes);
router.use('/disputes', disputesRoutes);
router.use('/marketplace',  marketplaceRoutes);
router.use('/meetings', meetingsRoutes);
router.use(productRoutes);

// Admin routes
router.get('/admin/ping', authRequired, requireRoles('ADMIN'), (req, res) => {
  res.json({ ok: true, role: req.user.role });
});

router.get('/artisan/ping', authRequired, requireRoles('ARTISAN'), (req, res) => {
  res.json({ ok: true, role: req.user.role });
});

router.get('/prescripteur/ping', authRequired, requireRoles('PRESCRIPTEUR'), (req, res) => {
  res.json({ ok: true, role: req.user.role });
});

router.get('/supplier/ping', authRequired, requireRoles('SUPPLIER'), (req, res) => {
  res.json({ ok: true, role: req.user.role });
});

// Admin: authentication logs
router.get('/admin/auth-logs', authRequired, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(200, Math.max(10, parseInt(req.query.limit || '50', 10) || 50));
    const skip = (page - 1) * limit;
    const match = {};
    if (req.query.action) match.action = String(req.query.action).toUpperCase();
    if (req.query.from || req.query.to) {
      match.createdAt = {};
      if (req.query.from) match.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) {
        const to = new Date(req.query.to);
        to.setHours(23, 59, 59, 999);
        match.createdAt.$lte = to;
      }
    }

    const [items, total] = await Promise.all([
      AuthLog.find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'firstName lastName email role')
        .lean(),
      AuthLog.countDocuments(match),
    ]);

    res.json({ page, limit, total, items });
  } catch (err) {
    next(err);
  }
});

// Admin: activity logs
router.get('/admin/activity-logs', authRequired, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '10', 10) || 10));
    const skip = (page - 1) * limit;
    const match = {};
    if (req.query.action) match.action = String(req.query.action);
    if (req.query.from || req.query.to) {
      match.createdAt = {};
      if (req.query.from) match.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) {
        const to = new Date(req.query.to);
        to.setHours(23, 59, 59, 999);
        match.createdAt.$lte = to;
      }
    }

    const [items, total] = await Promise.all([
      ActivityLog.find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'firstName lastName email')
        .lean(),
      ActivityLog.countDocuments(match),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({
      data: items,
      currentPage: page,
      totalPages,
      totalItems: total,
    });
  } catch (err) {
    next(err);
  }
});

// Admin: list all users
router.get('/admin/users', authRequired, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(200, Math.max(10, parseInt(req.query.limit || '50', 10) || 50));
    const skip = (page - 1) * limit;

    const roleFilter = String(req.query.role || '').toUpperCase();
    const statusFilter = String(req.query.status || '').toUpperCase();
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    if (to) to.setHours(23, 59, 59, 999);
    const q = String(req.query.q || '').trim();
    const match = {};
    if (roleFilter) match.role = roleFilter;
    if (statusFilter) match.status = statusFilter;
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = from;
      if (to) match.createdAt.$lte = to;
    }
    if (q) {
      const regex = new RegExp(q, 'i');
      match.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex }];
    }

      const users = await User.aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $project: {
            firstName: 1,
            lastName: 1,
            email: 1,
            phone: 1,
            role: 1,
            status: 1,
            emailVerified: 1,
            blockedUntil: 1,
            createdAt: 1,
          }
        },
        {
          $lookup: {
            from: Subscription.collection.name,
            localField: '_id',
            foreignField: 'userId',
            as: 'subscription',
          }
        },
        { $unwind: { path: '$subscription', preserveNullAndEmptyArrays: true } },
        { $addFields: {
            subscriptionPlan: { $ifNull: ['$subscription.plan', 'FREE'] },
            subscriptionStatus: { $ifNull: ['$subscription.status', 'INACTIVE'] },
          }
        },
        { $project: { subscription: 0 } },
        { $skip: skip },
        { $limit: limit },
      ]);

      const total = await User.countDocuments(match);

      res.json({ page, limit, total, users });
    } catch (err) {
      next(err);
    }
  });

router.patch('/admin/users/:id/block', authRequired, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const User = require('../models/User');
    const { duration } = req.body;

    const MS = {
      '1h': 1 * 60 * 60 * 1000,
      '3h': 3 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '3d': 3 * 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1m': 30 * 24 * 60 * 60 * 1000,
    };

    if (!MS[duration]) {
      return res.status(400).json({ message: 'Durée invalide. Utilisez : 1h, 3h, 1d, 3d, 1w, 1m' });
    }

    const blockedUntil = new Date(Date.now() + MS[duration]);
    const target = await User.findById(req.params.id).select('firstName lastName email role status blockedUntil');
    if (!target) return res.status(404).json({ message: 'Utilisateur introuvable' });
    if (target.role === 'ADMIN') {
      return res.status(403).json({ message: 'Impossible de bloquer un administrateur' });
    }
    target.status = 'BLOCKED';
    target.blockedUntil = blockedUntil;
    await target.save();

    await auditAdminAction(req, 'ADMIN_BLOCK_USER', {
      targetUserId: req.params.id,
      duration,
      blockedUntil,
    });
    try {
      notifyAdmins({ title: 'Utilisateur bloqué', message: `${target.firstName} ${target.lastName}` });
    } catch (_) {}

    res.json({ ok: true, user: target });
  } catch (err) {
    next(err);
  }
});

// Admin: unblock a user
router.patch('/admin/users/:id/unblock', authRequired, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const User = require('../models/User');

    const target = await User.findById(req.params.id).select('firstName lastName email role status blockedUntil');
    if (!target) return res.status(404).json({ message: 'Utilisateur introuvable' });
    target.status = 'ACTIVE';
    target.blockedUntil = null;
    await target.save();
    await auditAdminAction(req, 'ADMIN_UNBLOCK_USER', { targetUserId: req.params.id });
    try {
      notifyAdmins({ title: 'Utilisateur débloqué', message: `${target.firstName} ${target.lastName}` });
    } catch (_) {}
    res.json({ ok: true, user: target });
  } catch (err) {
    next(err);
  }
});


// Artisan: dashboard summary with real data
router.get('/artisan/dashboard-summary', authRequired, requireRoles('ARTISAN'), async (req, res, next) => {
  try {
    const artisanId = req.user._id;

    const [projects, quotes, invoices, orders] = await Promise.all([
      Project.find({ artisanId }).sort({ updatedAt: -1 }).lean(),
      Devis.find({ artisanId }).sort({ updatedAt: -1 }).populate('projectId', 'title').lean(),
      Facture.find({ artisanId }).sort({ updatedAt: -1 }).populate('projectId', 'title').lean(),
      Order.find({ artisanId }).sort({ updatedAt: -1 }).populate('productId', 'name').lean(),
    ]);

    const totalProjects = projects.length;
    const activeProjects = projects.filter((item) => item.status === 'ACTIVE').length;
    const pendingProjects = projects.filter((item) => item.status === 'PENDING').length;
    const completedProjects = projects.filter((item) => item.status === 'COMPLETED').length;
    const documentsCount = quotes.length + invoices.length;
    const inProgressOrders = orders.filter((item) => !['DELIVERED', 'REFUSED', 'CANCELLED'].includes(item.status)).length;
    const totalBudget = projects.reduce((sum, item) => sum + (Number(item.budgetTND) || 0), 0);
    const completionRate = totalProjects
      ? Math.round(projects.reduce((sum, item) => {
          const projectQuotes = quotes.filter((quote) => String(quote.projectId?._id || quote.projectId) === String(item._id));
          const projectInvoices = invoices.filter((invoice) => String(invoice.projectId?._id || invoice.projectId) === String(item._id));
          return sum + deriveProjectProgress(item, projectQuotes, projectInvoices).progress;
        }, 0) / totalProjects)
      : 0;
    const unpaidInvoicesAmount = invoices
      .filter((item) => item.status !== 'PAID')
      .reduce((sum, item) => sum + (Number(item.total) || 0), 0);

    const recentProjects = projects.slice(0, 4).map((project) => {
      const projectQuotes = quotes.filter((quote) => String(quote.projectId?._id || quote.projectId) === String(project._id));
      const projectInvoices = invoices.filter((invoice) => String(invoice.projectId?._id || invoice.projectId) === String(project._id));
      const progressMeta = deriveProjectProgress(project, projectQuotes, projectInvoices);

      return {
        _id: project._id,
        title: project.title,
        status: project.status,
        city: project?.location?.city || '',
        budgetTND: Number(project.budgetTND) || 0,
        progress: progressMeta.progress,
        progressLabel: progressMeta.label,
        updatedAt: project.updatedAt || project.createdAt,
      };
    });

    const recentActivity = [
      ...projects.map((item) => ({
        id: `project-${item._id}`,
        type: item.status === 'COMPLETED' ? 'project-completed' : 'project-updated',
        title: item.status === 'COMPLETED'
          ? `Projet terminé : ${item.title}`
          : `Projet mis à jour : ${item.title}`,
        time: formatRelativeDate(item.updatedAt || item.createdAt),
        createdAt: item.updatedAt || item.createdAt,
      })),
      ...quotes.map((item) => ({
        id: `quote-${item._id}`,
        type: 'quote',
        title: `Devis ${item.status === 'SENT' ? 'envoyé' : 'créé'}${item.projectId?.title ? ` • ${item.projectId.title}` : ''}`,
        time: formatRelativeDate(item.updatedAt || item.createdAt),
        createdAt: item.updatedAt || item.createdAt,
      })),
      ...invoices.map((item) => ({
        id: `invoice-${item._id}`,
        type: item.status === 'PAID' ? 'invoice-paid' : 'invoice',
        title: item.status === 'PAID'
          ? `Facture payée${item.projectId?.title ? ` • ${item.projectId.title}` : ''}`
          : `Facture ${item.status === 'SENT' ? 'envoyée' : 'créée'}${item.projectId?.title ? ` • ${item.projectId.title}` : ''}`,
        time: formatRelativeDate(item.updatedAt || item.createdAt),
        createdAt: item.updatedAt || item.createdAt,
      })),
      ...orders.map((item) => ({
        id: `order-${item._id}`,
        type: 'order',
        title: `Commande ${item.orderNumber || ''}${item.productId?.name ? ` • ${item.productId.name}` : ''}`.trim(),
        time: formatRelativeDate(item.updatedAt || item.createdAt),
        createdAt: item.updatedAt || item.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    res.json({
      ok: true,
      stats: {
        totalProjects,
        activeProjects,
        pendingProjects,
        completedProjects,
        documentsCount,
        inProgressOrders,
        totalBudget,
        completionRate,
        unpaidInvoicesAmount,
      },
      recentProjects,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
});

// Admin: dashboard summary with live data
router.get('/admin/dashboard-summary', authRequired, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const now = new Date();
    const days = Math.min(365, Math.max(7, parseInt(req.query.days || '30', 10) || 30));
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - days + 1);
    periodStart.setHours(0, 0, 0, 0);
    const previousPeriodStart = new Date(periodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      usersByRole,
      totalProducts,
      approvedProducts,
      totalOrders,
      deliveredOrders,
      openOrders,
      recentUsers,
      recentActivity,
      recentAuthLogs,
      newUsersCount,
      previousUsersCount,
      newOrdersCount,
      previousOrdersCount,
      revenueRaw,
      userGrowthRaw,
      orderStatusRaw,
      locationCentroid,
      locationRoleCoverage,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'ACTIVE' }),
      User.countDocuments({ status: 'BLOCKED' }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Product.countDocuments(),
      Product.countDocuments({ isApproved: true }),
      Order.countDocuments(),
      Order.find({ status: 'DELIVERED' }).select('lineTotal updatedAt').lean(),
      Order.countDocuments({ status: { $in: ['PENDING', 'ACCEPTED', 'CONTACTED', 'PREPARING', 'SHIPPED'] } }),
      User.find({}, 'firstName lastName role status createdAt').sort({ createdAt: -1 }).limit(4).lean(),
      ActivityLog.find().sort({ createdAt: -1 }).limit(4).populate('user', 'firstName lastName role').lean(),
      AuthLog.find().sort({ createdAt: -1 }).limit(4).populate('user', 'firstName lastName role').lean(),
      User.countDocuments({ createdAt: { $gte: periodStart } }),
      User.countDocuments({ createdAt: { $gte: previousPeriodStart, $lt: periodStart } }),
      Order.countDocuments({ createdAt: { $gte: periodStart } }),
      Order.countDocuments({ createdAt: { $gte: previousPeriodStart, $lt: periodStart } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: periodStart } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            users: { $sum: 0 },
            revenue: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, '$lineTotal', 0] } },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: periodStart } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            users: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.aggregate([{ $match: { 'location.lat': { $ne: null }, 'location.lng': { $ne: null } } }, { $group: { _id: null, avgLat: { $avg: '$location.lat' }, avgLng: { $avg: '$location.lng' }, trackedUsers: { $sum: 1 } } }]),
      User.aggregate([{ $match: { 'location.updatedAt': { $ne: null } } }, { $group: { _id: '$role', count: { $sum: 1 } } }]),
    ]);

    const roleCounts = usersByRole.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const deliveredRevenue = deliveredOrders.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);

    const alerts = [
      ...recentUsers.map((item) => ({
        id: `user-${item._id}`,
        tone: item.status === 'BLOCKED' ? 'red' : 'amber',
        title: item.status === 'BLOCKED' ? 'Compte bloqué' : 'Nouvelle inscription',
        subtitle: `${[item.firstName, item.lastName].filter(Boolean).join(' ')} • ${item.role}`,
        createdAt: item.createdAt,
      })),
      ...recentActivity.map((item) => ({
        id: `activity-${item._id}`,
        tone: 'indigo',
        title: item.action || 'Activité récente',
        subtitle: `${[item.user?.firstName, item.user?.lastName].filter(Boolean).join(' ') || 'Utilisateur'} • ${item.entity || 'Plateforme'}`,
        createdAt: item.createdAt,
      })),
      ...recentAuthLogs.map((item) => ({
        id: `auth-${item._id}`,
        tone: item.action === 'LOGOUT' ? 'amber' : 'indigo',
        title: item.action === 'LOGIN' || item.action === 'LOGIN_SMS' || item.action === 'LOGIN_GOOGLE' ? 'Connexion' : item.action,
        subtitle: `${[item.user?.firstName, item.user?.lastName].filter(Boolean).join(' ') || 'Utilisateur'}${item.country ? ` • ${item.country}` : ''}`,
        createdAt: item.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    const userSeriesMap = new Map(userGrowthRaw.map((item) => [item._id, item.users]));
    const revenueSeries = revenueRaw.map((item) => ({ date: item._id, revenue: Number((item.revenue || 0).toFixed(2)), orders: item.orders || 0 }));
    const userGrowth = revenueSeries.map((item) => ({ date: item.date, users: userSeriesMap.get(item.date) || 0 }));
    const mostActiveRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
    const userGrowthDeltaPct = previousUsersCount ? Number((((newUsersCount - previousUsersCount) / previousUsersCount) * 100).toFixed(1)) : (newUsersCount > 0 ? 100 : 0);
    const orderDeltaPct = previousOrdersCount ? Number((((newOrdersCount - previousOrdersCount) / previousOrdersCount) * 100).toFixed(1)) : (newOrdersCount > 0 ? 100 : 0);
    const orderStatusDistribution = orderStatusRaw.map((row) => ({ status: row._id, count: row.count }));
    const roleDistributionChart = Object.entries({
      ARTISAN: roleCounts.ARTISAN || 0,
      SUPPLIER: roleCounts.SUPPLIER || 0,
      PRESCRIPTEUR: roleCounts.PRESCRIPTEUR || 0,
      ADMIN: roleCounts.ADMIN || 0,
    }).map(([role, count]) => ({ role, count }));

    res.json({
      ok: true,
      stats: {
        totalUsers,
        activeUsers,
        blockedUsers,
        totalProducts,
        approvedProducts,
        totalOrders,
        openOrders,
        deliveredRevenue: Number(deliveredRevenue.toFixed(2)),
      },
      roleDistribution: {
        artisans: roleCounts.ARTISAN || 0,
        suppliers: roleCounts.SUPPLIER || 0,
        prescripteurs: roleCounts.PRESCRIPTEUR || 0,
        admins: roleCounts.ADMIN || 0,
      },
      charts: {
        userGrowth,
        revenueOverTime: revenueSeries,
        ordersStatusDistribution: orderStatusDistribution,
        roleDistribution: roleDistributionChart,
      },
      highlights: {
        mostActiveRole: { role: mostActiveRole[0], count: mostActiveRole[1] },
        revenueTrend: revenueSeries.length > 1 ? (revenueSeries[revenueSeries.length - 1].revenue - revenueSeries[0].revenue) : 0,
      },
      changes: {
        userGrowthPct: userGrowthDeltaPct,
        ordersGrowthPct: orderDeltaPct,
      },
      locationAnalytics: {
        trackedUsers: locationCentroid?.[0]?.trackedUsers || 0,
        avgLat: locationCentroid?.[0]?.avgLat || null,
        avgLng: locationCentroid?.[0]?.avgLng || null,
        roleCoverage: locationRoleCoverage || [],
      },
      alerts,
    });
  } catch (err) {
    next(err);
  }
});

// Admin: AI-powered insights
router.get('/admin/ai-insights', authRequired, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const days = Math.min(90, Math.max(7, parseInt(req.query.days || '30', 10) || 30));
    const forceRefresh = req.query.refresh === 'true';
    const report = await getAiInsights(days, forceRefresh);
    res.json({ ok: true, ...report });
  } catch (err) {
    next(err);
  }
});

// Admin: Detailed User Statistics
router.get('/admin/user-statistics', authRequired, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Most Active Users (based on recent activity)
    const [recentProjects, recentOrders, recentMessages] = await Promise.all([
      Project.aggregate([
        { $match: { updatedAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$artisanId', projectCount: { $sum: 1 }, lastActivity: { $max: '$updatedAt' } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $sort: { projectCount: -1 } },
        { $limit: 10 }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$supplierId', orderCount: { $sum: 1 }, totalRevenue: { $sum: '$lineTotal' }, lastActivity: { $max: '$createdAt' } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $sort: { orderCount: -1 } },
        { $limit: 10 }
      ]),
      User.aggregate([
        { $match: { lastLoginAt: { $gte: sevenDaysAgo } } },
        { $sort: { lastLoginAt: -1 } },
        { $limit: 20 }
      ])
    ]);

    // Inactive Users (no activity in last 15 days)
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const inactiveUsers = await User.find({
      $or: [
        { lastLoginAt: { $lt: fifteenDaysAgo } },
        { lastLoginAt: { $exists: false } }
      ],
      createdAt: { $lt: fifteenDaysAgo }
    })
    .select('firstName lastName role lastLoginAt createdAt')
    .sort({ lastLoginAt: 1 })
    .limit(10)
    .lean();

    // Top Buyers (based on order totals)
    const topBuyers = await Order.aggregate([
      { $match: { status: { $in: ['DELIVERED', 'ACCEPTED'] } } },
      { $group: { 
        _id: '$artisanId', 
        totalSpent: { $sum: '$lineTotal' }, 
        orderCount: { $sum: 1 } 
      }},
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    // Project Leaders (artisans with most completed projects)
    const projectLeaders = await Project.aggregate([
      { $group: { 
        _id: '$artisanId', 
        totalProjects: { $sum: 1 },
        completedProjects: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } }
      }},
      { $addFields: { 
        completionRate: { 
          $multiply: [
            { $divide: ['$completedProjects', '$totalProjects'] }, 
            100
          ] 
        }
      }},
      { $match: { totalProjects: { $gte: 3 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $sort: { totalProjects: -1 } },
      { $limit: 10 }
    ]);

    // Weekly Activity Data
    const weeklyActivity = await User.aggregate([
      {
        $group: {
          _id: {
            $dayOfWeek: { $ifNull: ['$lastLoginAt', '$createdAt'] }
          },
          activeUsers: {
            $sum: {
              $cond: [
                { $gte: [{ $ifNull: ['$lastLoginAt', '$createdAt'] }, sevenDaysAgo] },
                1,
                0
              ]
            }
          },
          inactiveUsers: {
            $sum: {
              $cond: [
                { $lt: [{ $ifNull: ['$lastLoginAt', '$createdAt'] }, sevenDaysAgo] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const activityData = weeklyActivity.map(item => ({
      period: dayNames[item._id - 1] || 'N/A',
      active: item.activeUsers,
      inactive: item.inactiveUsers
    }));

    // Format the response data
    const mostActiveUsers = [
      ...recentProjects.map(item => ({
        name: `${item.user.firstName} ${item.user.lastName}`,
        role: 'Artisan',
        projects: item.projectCount,
        revenue: 0, // Projects don't have direct revenue
        lastActive: formatRelativeDate(item.lastActivity)
      })),
      ...recentOrders.map(item => ({
        name: `${item.user.firstName} ${item.user.lastName}`,
        role: 'Fournisseur',
        orders: item.orderCount,
        revenue: item.totalRevenue || 0,
        lastActive: formatRelativeDate(item.lastActivity)
      }))
    ].slice(0, 5);

    const formattedInactiveUsers = inactiveUsers.map(user => ({
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      lastActive: user.lastLoginAt ? formatRelativeDate(user.lastLoginAt) : 'Jamais connecté',
      projects: 0 // Could be enhanced with actual project count
    }));

    const formattedTopBuyers = topBuyers.map(buyer => ({
      name: `${buyer.user.firstName} ${buyer.user.lastName}`,
      role: buyer.user.role,
      totalSpent: buyer.totalSpent || 0,
      orders: buyer.orderCount || 0
    }));

    const formattedProjectLeaders = projectLeaders.map(leader => ({
      name: `${leader.user.firstName} ${leader.user.lastName}`,
      role: leader.user.role,
      projects: leader.totalProjects || 0,
      completionRate: Math.round(leader.completionRate || 0)
    }));

    await auditAdminAction(req, 'ADMIN_VIEW_USER_STATISTICS', {
      timestamp: new Date(),
      dataPoints: {
        activeUsers: mostActiveUsers.length,
        inactiveUsers: formattedInactiveUsers.length,
        topBuyers: formattedTopBuyers.length,
        projectLeaders: formattedProjectLeaders.length
      }
    });

    res.json({
      ok: true,
      mostActiveUsers,
      inactiveUsers: formattedInactiveUsers,
      topBuyers: formattedTopBuyers,
      projectLeaders: formattedProjectLeaders,
      activityData,
      generatedAt: new Date()
    });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/transactions', authRequired, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const Subscription = require('../models/Subscription');
    const Facture = require('../models/Facture');

    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    if (to) to.setHours(23, 59, 59, 999);
    const statusFilter = req.query.status ? String(req.query.status).toUpperCase() : '';
    const dateQuery = {};
    if (from) dateQuery.$gte = from;
    if (to) dateQuery.$lte = to;
    const hasDate = Object.keys(dateQuery).length > 0;
    const orderMatch = {
      ...(hasDate ? { createdAt: dateQuery } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    };
    const subscriptionMatch = {
      ...(hasDate ? { createdAt: dateQuery } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    };
    const invoiceMatch = {
      ...(hasDate ? { createdAt: dateQuery } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    };

    const [orders, subscriptions, invoices] = await Promise.all([
      Order.find(orderMatch).sort({ createdAt: -1 })
        .populate('artisanId', 'firstName lastName email')
        .populate('supplierId', 'firstName lastName email')
        .populate('productId', 'name')
        .lean(),
      Subscription.find(subscriptionMatch).sort({ createdAt: -1 })
        .populate('userId', 'firstName lastName email')
        .lean(),
      Facture.find(invoiceMatch).sort({ createdAt: -1 })
        .populate('artisanId', 'firstName lastName email')
        .populate('projectId', 'title')
        .lean(),
    ]);

    // Normalize into unified transaction list
    const transactions = [
      ...orders.map(o => ({
        _id: `order-${o._id}`,
        type: 'order',
        ref: o.orderNumber || String(o._id).slice(-8).toUpperCase(),
        user: o.artisanId ? `${o.artisanId.firstName} ${o.artisanId.lastName}` : '—',
        description: o.productId?.name ? `Commande: ${o.productId.name}` : 'Commande produit',
        amount: o.lineTotal || 0,
        status: o.status,
        date: o.createdAt,
      })),
      ...subscriptions.map(s => ({
        _id: `sub-${s._id}`,
        type: 'subscription',
        ref: String(s._id).slice(-8).toUpperCase(),
        user: s.userId ? `${s.userId.firstName} ${s.userId.lastName}` : '—',
        description: `Abonnement ${s.plan}`,
        amount: s.plan === 'PRO' ? 399 : s.plan === 'BASIC' ? 40 : 0,
        status: s.status,
        date: s.createdAt,
      })),
      ...invoices.map(f => ({
        _id: `inv-${f._id}`,
        type: 'invoice',
        ref: String(f._id).slice(-8).toUpperCase(),
        user: f.artisanId ? `${f.artisanId.firstName} ${f.artisanId.lastName}` : '—',
        description: f.projectId?.title ? `Facture: ${f.projectId.title}` : 'Facture projet',
        amount: f.total || 0,
        status: f.status,
        date: f.createdAt,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Stats
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
    const paidInvoices = invoices.filter(f => f.status === 'PAID');
    const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE' && s.plan !== 'FREE');

    const stats = {
      totalOrders: orders.length,
      deliveredOrders: deliveredOrders.length,
      ordersRevenue: Number(deliveredOrders.reduce((s, o) => s + (o.lineTotal || 0), 0).toFixed(2)),
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      paidInvoices: paidInvoices.length,
      invoicesRevenue: Number(paidInvoices.reduce((s, f) => s + (f.total || 0), 0).toFixed(2)),
    };

    res.json({ ok: true, stats, transactions });
  } catch (err) {
    next(err);
  }
});
router.get('/debug/all-products', authRequired, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const products = await Product.find({})
      .populate('categoryId', 'name slug')
      .populate('supplierId', 'companyName')
      .lean();
    
    res.json({
      count: products.length,
      products: products,
      message: 'Tous les produits en base de données'
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;