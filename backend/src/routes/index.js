const express = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const { authRequired } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const AuthLog = require('../models/AuthLog');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

router.get('/health', (req, res) => res.json({ ok: true }));

router.use('/auth', authRoutes);

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


// Admin: activity logs (profile updates, password changes, sms login, etc.)
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
    const page  = Math.max(1, parseInt(req.query.page  || '1',  10) || 1);
    const limit = Math.min(200, Math.max(10, parseInt(req.query.limit || '50', 10) || 50));
    const skip  = (page - 1) * limit;

    const User = require('../models/User');

    const [users, total] = await Promise.all([
      User.find({}, 'firstName lastName email phone role status emailVerified blockedUntil createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);

    res.json({ ok: true, page, limit, total, users });
  } catch (err) {
    next(err);
  }
});

// Admin: block a user
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

module.exports = router;