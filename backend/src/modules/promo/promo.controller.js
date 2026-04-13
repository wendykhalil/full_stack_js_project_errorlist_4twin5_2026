const PromoCode = require("../../models/PromoCode");

// POST /promo/validate — check if a code is valid and return discount
async function validate(req, res, next) {
  try {
    const { code, plan } = req.body || {};
    if (!code) return res.status(400).json({ message: "Code requis" });

    const promo = await PromoCode.findOne({ code: code.toUpperCase().trim() });

    if (!promo || !promo.isActive) {
      return res.status(404).json({ message: "Code promo invalide ou inactif" });
    }

    if (promo.expiresAt && new Date() > promo.expiresAt) {
      return res.status(400).json({ message: "Ce code promo a expiré" });
    }

    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return res.status(400).json({ message: "Ce code promo a atteint sa limite d'utilisation" });
    }

    if (promo.appliesTo !== "both" && plan && promo.appliesTo !== plan) {
      return res.status(400).json({ message: `Ce code est valable uniquement pour le plan ${promo.appliesTo}` });
    }

    return res.json({
      ok: true,
      discountPercent: promo.discountPercent,
      code: promo.code,
      appliesTo: promo.appliesTo,
    });
  } catch (err) {
    return next(err);
  }
}

// GET /promo — list all promo codes (admin)
async function list(req, res, next) {
  try {
    const codes = await PromoCode.find().sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, codes });
  } catch (err) {
    return next(err);
  }
}

// POST /promo — create a promo code (admin)
async function create(req, res, next) {
  try {
    const { code, discountPercent, maxUses, expiresAt, isActive, appliesTo } = req.body || {};

    if (!code?.trim()) return res.status(400).json({ message: "Code requis" });
    if (!discountPercent || discountPercent < 1 || discountPercent > 100) {
      return res.status(400).json({ message: "Remise entre 1 et 100%" });
    }

    const promo = await PromoCode.create({
      code: code.toUpperCase().trim(),
      discountPercent: Number(discountPercent),
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: isActive !== false,
      appliesTo: appliesTo || "both",
    });

    return res.status(201).json({ ok: true, promo });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "Ce code existe déjà" });
    return next(err);
  }
}

// PATCH /promo/:id — update (admin)
async function update(req, res, next) {
  try {
    const { discountPercent, maxUses, expiresAt, isActive, appliesTo } = req.body || {};
    const promo = await PromoCode.findById(req.params.id);
    if (!promo) return res.status(404).json({ message: "Not found" });

    if (discountPercent !== undefined) promo.discountPercent = Number(discountPercent);
    if (maxUses !== undefined) promo.maxUses = maxUses ? Number(maxUses) : null;
    if (expiresAt !== undefined) promo.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) promo.isActive = Boolean(isActive);
    if (appliesTo !== undefined) promo.appliesTo = appliesTo;

    await promo.save();
    return res.json({ ok: true, promo });
  } catch (err) {
    return next(err);
  }
}

// DELETE /promo/:id — delete (admin)
async function remove(req, res, next) {
  try {
    await PromoCode.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = { validate, list, create, update, remove };
