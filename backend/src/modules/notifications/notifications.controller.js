const Notification = require('../../models/Notification');

function uid(req) { return req.user?._id || req.user?.id; }

async function list(req, res, next) {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const filter = { userId: uid(req) };
    if (unread === 'true') filter.read = false;

    const [items, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Notification.countDocuments(filter),
    ]);
    return res.json({ ok: true, items, total });
  } catch (err) { return next(err); }
}

async function unreadCount(req, res, next) {
  try {
    const count = await Notification.countDocuments({ userId: uid(req), read: false });
    return res.json({ ok: true, count });
  } catch (err) { return next(err); }
}

async function markRead(req, res, next) {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: uid(req) },
      { read: true }
    );
    return res.json({ ok: true });
  } catch (err) { return next(err); }
}

async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany({ userId: uid(req), read: false }, { read: true });
    return res.json({ ok: true });
  } catch (err) { return next(err); }
}

async function remove(req, res, next) {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: uid(req) });
    return res.json({ ok: true });
  } catch (err) { return next(err); }
}

module.exports = { list, unreadCount, markRead, markAllRead, remove };
