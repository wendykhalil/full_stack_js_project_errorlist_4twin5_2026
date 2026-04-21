const Report = require('../../models/Report');
const { notify } = require('../../utils/notify');

function uid(req) { return req.user?._id || req.user?.id; }

// POST /reports — submit a report
async function create(req, res, next) {
  try {
    const { targetId, targetType = 'USER', reason, description } = req.body || {};
    if (!targetId) return res.status(400).json({ message: 'targetId est requis' });
    if (!reason) return res.status(400).json({ message: 'La raison est requise' });
    if (String(targetId) === String(uid(req))) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous signaler vous-même' });
    }

    const report = await Report.create({
      reportedBy: uid(req),
      targetId,
      targetType,
      reason,
      description: description?.trim() || '',
    });

    return res.status(201).json({ ok: true, report });
  } catch (err) { return next(err); }
}

// GET /reports/my
async function listMine(req, res, next) {
  try {
    const reports = await Report.find({ reportedBy: uid(req) })
      .sort({ createdAt: -1 })
      .populate('targetId', 'firstName lastName role')
      .lean();
    return res.json({ ok: true, data: reports });
  } catch (err) { return next(err); }
}

// GET /reports/admin/reports
async function adminList(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'ALL') filter.status = status;

    const [data, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate('reportedBy', 'firstName lastName email role')
        .populate('targetId', 'firstName lastName email role')
        .lean(),
      Report.countDocuments(filter),
    ]);

    // Normalize for frontend compatibility
    const normalized = data.map(r => ({
      ...r,
      reportedBy: { id: r.reportedBy, name: r.reportedBy ? `${r.reportedBy.firstName} ${r.reportedBy.lastName}` : '—' },
      reportedUser: { id: r.targetId, name: r.targetId ? `${r.targetId.firstName} ${r.targetId.lastName}` : '—' },
    }));

    return res.json({ ok: true, data: normalized, total });
  } catch (err) { return next(err); }
}

// PATCH /reports/admin/reports/:id/action
async function adminAction(req, res, next) {
  try {
    const { action, reason, note } = req.body || {};
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Signalement non trouvé' });

    const fromStatus = report.status;
    let toStatus = report.status;

    switch (action) {
      case 'REVIEW':   toStatus = 'UNDER_REVIEW'; break;
      case 'WARN':     toStatus = 'RESOLVED'; break;
      case 'BAN':      toStatus = 'RESOLVED'; break;
      case 'REJECT':   toStatus = 'REJECTED'; break;
      default: return res.status(400).json({ message: 'Action invalide' });
    }

    report.status = toStatus;
    if (note) report.adminNote = note;
    report.actionHistory.push({
      action,
      fromStatus,
      toStatus,
      note: note || reason || '',
      performedBy: uid(req),
    });

    await report.save();

    // Notify the reported user if warned or banned
    if (action === 'WARN' || action === 'BAN') {
      await notify({
        userId: report.targetId,
        type: 'GENERAL',
        title: action === 'BAN' ? 'Votre compte a été suspendu' : 'Avertissement reçu',
        message: reason || 'Suite à un signalement, une action a été prise sur votre compte.',
        link: '/profile',
      });
    }

    return res.json({ ok: true, report });
  } catch (err) { return next(err); }
}

module.exports = { create, listMine, adminList, adminAction };
