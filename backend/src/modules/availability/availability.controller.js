const Availability = require("../../models/Availability");

function uid(req) { return req.user?._id || req.user?.id; }

function startOfDay(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

// GET /availability/my?month=2026-04
async function getMine(req, res, next) {
  try {
    const filter = { artisanId: uid(req) };
    if (req.query.month) {
      const [y, m] = req.query.month.split("-").map(Number);
      filter.date = {
        $gte: new Date(y, m - 1, 1),
        $lt: new Date(y, m, 1),
      };
    }
    const items = await Availability.find(filter).sort({ date: 1 }).lean();
    return res.json({ ok: true, items });
  } catch (err) { return next(err); }
}

// POST /availability — upsert a day
async function upsert(req, res, next) {
  try {
    const { date, status, note } = req.body || {};
    if (!date) return res.status(400).json({ message: "date is required" });

    const day = startOfDay(date);
    const doc = await Availability.findOneAndUpdate(
      { artisanId: uid(req), date: day },
      { status: status || "AVAILABLE", note: note?.trim() || "" },
      { upsert: true, new: true }
    );
    return res.json({ ok: true, availability: doc });
  } catch (err) { return next(err); }
}

// DELETE /availability/:date
async function remove(req, res, next) {
  try {
    const day = startOfDay(req.params.date);
    await Availability.deleteOne({ artisanId: uid(req), date: day });
    return res.json({ ok: true });
  } catch (err) { return next(err); }
}

// GET /availability/artisan/:artisanId?month=2026-04
async function getForArtisan(req, res, next) {
  try {
    const filter = { artisanId: req.params.artisanId };
    if (req.query.month) {
      const [y, m] = req.query.month.split("-").map(Number);
      filter.date = {
        $gte: new Date(y, m - 1, 1),
        $lt: new Date(y, m, 1),
      };
    }
    const items = await Availability.find(filter).sort({ date: 1 }).lean();
    return res.json({ ok: true, items });
  } catch (err) { return next(err); }
}

module.exports = { getMine, upsert, remove, getForArtisan };
