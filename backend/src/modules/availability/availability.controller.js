const Availability = require("../../models/Availability");

function uid(req) { return req.user?._id || req.user?.id; }

// Convert YYYY-MM-DD string to start-of-day Date in local timezone
function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  return date;
}

// Format Date to YYYY-MM-DD string (local timezone)
function formatDateAsLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// GET /availability/my?month=2026-04
async function getMine(req, res, next) {
  try {
    const filter = { artisanId: uid(req) };
    if (req.query.month) {
      const [y, m] = req.query.month.split("-").map(Number);
      // Use local timezone for consistent date filtering
      const monthStart = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const monthEnd = new Date(y, m, 1, 0, 0, 0, 0);
      filter.date = {
        $gte: monthStart,
        $lt: monthEnd,
      };
    }
    const items = await Availability.find(filter).sort({ date: 1 }).lean();
    // Convert dates to YYYY-MM-DD strings to avoid timezone issues
    const formatted = items.map(item => ({
      ...item,
      date: formatDateAsLocal(item.date)
    }));
    return res.json({ ok: true, items: formatted });
  } catch (err) { return next(err); }
}

// POST /availability — upsert a day
async function upsert(req, res, next) {
  try {
    const { date, status, note, timeSlots } = req.body || {};
    if (!date) return res.status(400).json({ message: "date is required" });

    // Parse date string (YYYY-MM-DD) in local timezone
    const day = parseLocalDate(date);
    const doc = await Availability.findOneAndUpdate(
      { artisanId: uid(req), date: day },
      { 
        status: status || "AVAILABLE", 
        note: note?.trim() || "",
        timeSlots: timeSlots || { morning: false, afternoon: false, evening: false }
      },
      { upsert: true, new: true }
    );
    return res.json({ ok: true, availability: { ...doc.toObject(), date: formatDateAsLocal(doc.date) } });
  } catch (err) { return next(err); }
}

// DELETE /availability/:date
async function remove(req, res, next) {
  try {
    const day = parseLocalDate(req.params.date);
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
      // Use local timezone for consistent date filtering
      const monthStart = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const monthEnd = new Date(y, m, 1, 0, 0, 0, 0);
      filter.date = {
        $gte: monthStart,
        $lt: monthEnd,
      };
    }
    const items = await Availability.find(filter).sort({ date: 1 }).lean();
    // Convert dates to YYYY-MM-DD strings to avoid timezone issues
    const formatted = items.map(item => ({
      ...item,
      date: formatDateAsLocal(item.date)
    }));
    return res.json({ ok: true, items: formatted });
  } catch (err) { return next(err); }
}

module.exports = { getMine, upsert, remove, getForArtisan };
