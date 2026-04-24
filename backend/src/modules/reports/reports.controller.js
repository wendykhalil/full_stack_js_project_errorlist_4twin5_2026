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

    // Fetch raw docs first without populate to avoid ObjectId cast errors on legacy data
    const [rawData, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Report.countDocuments(filter),
    ]);

    const mongoose = require('mongoose');

    // Separate docs with valid ObjectId refs from legacy/corrupt ones
    const validIds = rawData.filter(
      r => mongoose.isValidObjectId(r.reportedBy) && mongoose.isValidObjectId(r.targetId)
    );
    const invalidIds = rawData.filter(
      r => !mongoose.isValidObjectId(r.reportedBy) || !mongoose.isValidObjectId(r.targetId)
    );

    // Populate only the valid ones
    const populated = await Report.populate(validIds, [
      { path: 'reportedBy', select: 'firstName lastName email role' },
      { path: 'targetId',   select: 'firstName lastName email role' },
    ]);

    // Merge back in original order
    const populatedMap = new Map(populated.map(r => [String(r._id), r]));
    const data = rawData.map(r => populatedMap.get(String(r._id)) || r);

    // Normalize for frontend compatibility — handle both new (ObjectId ref) and legacy (embedded object) formats
    const normalized = data.map(r => {
      // reportedBy: could be a populated User object, an ObjectId, or a legacy embedded object
      const reportedByObj = r.reportedBy;
      let reportedByName = '—';
      if (reportedByObj && typeof reportedByObj === 'object' && reportedByObj.firstName) {
        reportedByName = `${reportedByObj.firstName || ''} ${reportedByObj.lastName || ''}`.trim() || '—';
      } else if (reportedByObj && typeof reportedByObj === 'object' && reportedByObj.name) {
        reportedByName = reportedByObj.name;
      }

      // targetId: same logic
      const targetObj = r.targetId;
      let reportedUserName = '—';
      if (targetObj && typeof targetObj === 'object' && targetObj.firstName) {
        reportedUserName = `${targetObj.firstName || ''} ${targetObj.lastName || ''}`.trim() || '—';
      } else if (targetObj && typeof targetObj === 'object' && targetObj.name) {
        reportedUserName = targetObj.name;
      }

      // Also handle legacy format where reportedUser was stored as embedded object
      if (reportedUserName === '—' && r.reportedUser) {
        const lu = r.reportedUser;
        reportedUserName = lu.name || (lu.id && typeof lu.id === 'object' && lu.id.firstName
          ? `${lu.id.firstName} ${lu.id.lastName || ''}`.trim()
          : '—');
      }
      if (reportedByName === '—' && r.reportedBy && typeof r.reportedBy === 'object' && r.reportedBy.email) {
        reportedByName = r.reportedBy.email;
      }

      return {
        ...r,
        reportedBy: { id: reportedByObj, name: reportedByName },
        reportedUser: { id: targetObj, name: reportedUserName },
      };
    });

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
