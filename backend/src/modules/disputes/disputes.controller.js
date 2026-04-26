const mongoose = require('mongoose');
const Dispute = require('../../models/Dispute');
const { notify } = require('../../utils/notify');

function uid(req) { return req.user?._id || req.user?.id; }

// POST /disputes
async function create(req, res, next) {
  try {
    const { againstId, sourceType, sourceId, reason, description } = req.body || {};
    if (!againstId) return res.status(400).json({ message: 'againstId est requis' });

    // Validate that againstId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(againstId)) {
      return res.status(400).json({ message: 'againstId invalide — doit être un identifiant MongoDB valide' });
    }
    if (!mongoose.Types.ObjectId.isValid(sourceId)) {
      return res.status(400).json({ message: 'sourceId invalide — doit être un identifiant MongoDB valide' });
    }
    if (!sourceType || !['ORDER', 'SERVICE_REQUEST'].includes(sourceType)) {
      return res.status(400).json({ message: 'sourceType doit être ORDER ou SERVICE_REQUEST' });
    }
    if (!sourceId) return res.status(400).json({ message: 'sourceId est requis' });
    if (!reason) return res.status(400).json({ message: 'La raison est requise' });
    if (!description?.trim()) return res.status(400).json({ message: 'La description est requise' });

    const dispute = await Dispute.create({
      openedBy: uid(req),
      againstId,
      sourceType,
      sourceId,
      reason,
      description: description.trim(),
    });

    // Notify the other party
    await notify({
      userId: againstId,
      type: 'GENERAL',
      title: 'Un litige a été ouvert',
      message: 'Un utilisateur a ouvert un litige vous concernant. Consultez la section Litiges.',
      link: '/profile',
    });

    return res.status(201).json({ ok: true, dispute });
  } catch (err) { return next(err); }
}

// GET /disputes/my
async function listMine(req, res, next) {
  try {
    const userId = String(uid(req));
    const disputes = await Dispute.find({
      $or: [{ openedBy: userId }, { againstId: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('openedBy', 'firstName lastName role')
      .populate('againstId', 'firstName lastName role')
      .lean();
    return res.json({ ok: true, disputes });
  } catch (err) { return next(err); }
}

// GET /disputes/:id
async function getOne(req, res, next) {
  try {
    const userId = String(uid(req));
    const dispute = await Dispute.findById(req.params.id)
      .populate('openedBy', 'firstName lastName role profilePicture')
      .populate('againstId', 'firstName lastName role profilePicture')
      .populate('messages.authorId', 'firstName lastName role')
      .lean();

    if (!dispute) return res.status(404).json({ message: 'Litige non trouvé' });

    const isParty = String(dispute.openedBy?._id) === userId || String(dispute.againstId?._id) === userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isParty && !isAdmin) return res.status(403).json({ message: 'Accès refusé' });

    return res.json({ ok: true, dispute });
  } catch (err) { return next(err); }
}

// POST /disputes/:id/message
async function addMessage(req, res, next) {
  try {
    const { content } = req.body || {};
    if (!content?.trim()) return res.status(400).json({ message: 'Le message ne peut pas être vide' });

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: 'Litige non trouvé' });

    const userId = String(uid(req));
    const isParty = String(dispute.openedBy) === userId || String(dispute.againstId) === userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isParty && !isAdmin) return res.status(403).json({ message: 'Accès refusé' });

    if (['RESOLVED_FOR_OPENER', 'RESOLVED_FOR_OPPONENT', 'CLOSED'].includes(dispute.status)) {
      return res.status(400).json({ message: 'Ce litige est clôturé' });
    }

    dispute.messages.push({ authorId: uid(req), content: content.trim() });
    if (dispute.status === 'OPEN') dispute.status = 'IN_PROGRESS';
    await dispute.save();

    // Notify the other party
    const notifyId = String(dispute.openedBy) === userId ? dispute.againstId : dispute.openedBy;
    await notify({
      userId: notifyId,
      type: 'GENERAL',
      title: 'Nouveau message dans votre litige',
      message: content.trim().slice(0, 100),
      link: '/profile',
    });

    return res.json({ ok: true });
  } catch (err) { return next(err); }
}

// GET /disputes/admin/disputes
async function adminList(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'ALL') filter.status = status;

    const [disputes, total] = await Promise.all([
      Dispute.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate('openedBy', 'firstName lastName email role')
        .populate('againstId', 'firstName lastName email role')
        .lean(),
      Dispute.countDocuments(filter),
    ]);

    return res.json({ ok: true, disputes, total });
  } catch (err) { return next(err); }
}

// PATCH /disputes/admin/disputes/:id/resolve
async function adminResolve(req, res, next) {
  try {
    const { resolution, adminNote } = req.body || {};
    const allowed = ['RESOLVED_FOR_OPENER', 'RESOLVED_FOR_OPPONENT', 'CLOSED'];
    if (!allowed.includes(resolution)) {
      return res.status(400).json({ message: `resolution doit être: ${allowed.join(', ')}` });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: 'Litige non trouvé' });

    dispute.status = resolution;
    dispute.adminNote = adminNote || '';
    dispute.resolvedAt = new Date();
    dispute.messages.push({
      authorId: uid(req),
      content: `[Admin] Litige résolu: ${resolution}${adminNote ? ` — ${adminNote}` : ''}`,
    });
    await dispute.save();

    // Notify both parties
    const msg = resolution === 'CLOSED'
      ? 'Votre litige a été clôturé par l\'administrateur.'
      : `Votre litige a été résolu en faveur de ${resolution === 'RESOLVED_FOR_OPENER' ? 'l\'ouvreur' : 'l\'autre partie'}.`;

    await Promise.all([
      notify({ userId: dispute.openedBy, type: 'GENERAL', title: 'Litige résolu', message: msg }),
      notify({ userId: dispute.againstId, type: 'GENERAL', title: 'Litige résolu', message: msg }),
    ]);

    return res.json({ ok: true, dispute });
  } catch (err) { return next(err); }
}

module.exports = { create, listMine, getOne, addMessage, adminList, adminResolve };
