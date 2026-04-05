const express = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const projectsRoutes = require('../modules/projects/projects.routes');
const supplierRoutes = require('../modules/supplier/supplier.routes');
const catalogRoutes = require('../modules/catalog/catalog.routes');
const ordersRoutes = require('../modules/orders/orders.routes');
const messagesRoutes = require('../modules/messages/messages.routes');
const documentsRoutes = require('../modules/documents/documents.routes');
const aiRoutes = require('../modules/ai-assistant/ai.routes');
const translationRoutes = require('../modules/translation/translation.routes');

// ✅ NOUVEAUX IMPORTS
const artisanProfileRoutes = require('../modules/artisan/artisanProfile.routes');
const portfolioRoutes = require('../modules/artisan/portfolio.routes');
const searchRoutes = require('../modules/search/search.routes');
const subscriptionRoutes = require('../modules/subscription/subscription.routes');
const weatherRoutes = require('../modules/weather/weather.routes');

const { authRequired } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const AuthLog = require('../models/AuthLog');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const Product = require('../models/Product');
const Project = require('../models/Project');
const Order = require('../models/Order');
const Devis = require('../models/Devis');
const Facture = require('../models/Facture');

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


router.get('/health', (req, res) => res.json({ ok: true }));

router.use('/auth', authRoutes);
router.use('/projects', projectsRoutes);
router.use('/supplier', supplierRoutes);
router.use('/catalog', catalogRoutes);
router.use('/orders', ordersRoutes);
router.use('/messages', messagesRoutes);
router.use('/documents', documentsRoutes);
router.use('/ai', aiRoutes);
router.use('/translations', translationRoutes);

// ✅ NOUVELLES ROUTES
router.use('/artisan/profile', artisanProfileRoutes);
router.use('/artisan/portfolio', portfolioRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/search', searchRoutes);
router.use('/weather', weatherRoutes);

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

    const [items, total] = await Promise.all([
      AuthLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'firstName lastName email role')
        .lean(),
      AuthLog.countDocuments(),
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
    const limit = Math.min(200, Math.max(10, parseInt(req.query.limit || '50', 10) || 50));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ActivityLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'firstName lastName email phone role')
        .lean(),
      ActivityLog.countDocuments(),
    ]);

    res.json({ page, limit, total, items });
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

    const User = require('../models/User');
      const Subscription = require('../models/Subscription');

      const users = await User.aggregate([
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

      const total = await User.countDocuments();

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
      return res.status(400).json({ message: 'Invalid duration. Use: 1h, 3h, 1d, 3d, 1w, 1m' });
    }

    const blockedUntil = new Date(Date.now() + MS[duration]);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'BLOCKED', blockedUntil },
      { new: true, select: 'firstName lastName email status blockedUntil' }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
});

// Admin: unblock a user
router.patch('/admin/users/:id/unblock', authRequired, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const User = require('../models/User');

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'ACTIVE', blockedUntil: null },
      { new: true, select: 'firstName lastName email status blockedUntil' }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ ok: true, user });
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
      alerts,
    });
  } catch (err) {
    next(err);
  }
});

// 🔍 DEBUG ROUTE
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
      message: 'All products in database'
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;