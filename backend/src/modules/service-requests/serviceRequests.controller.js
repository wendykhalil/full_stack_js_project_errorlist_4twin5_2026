const ServiceRequest = require("../../models/ServiceRequest");
const ArtisanProfile = require("../../models/ArtisanProfile");
const Availability = require("../../models/Availability");
const User = require("../../models/User");
const { notify } = require("../../utils/notify");
const { sendApplicationReceivedEmail, sendApplicationAcceptedEmail } = require("../../utils/serviceRequestEmail");

function uid(req) {
  return req.user?._id || req.user?.id || req.user?.sub;
}

// ─── PRESCRIPTEUR ────────────────────────────────────────────────────────────

async function create(req, res, next) {
  try {
    const { title, description, trade, city, budgetTND, deadline, maxApplicants } = req.body || {};
    if (!title?.trim()) return res.status(400).json({ message: "title is required" });
    if (!trade) return res.status(400).json({ message: "trade is required" });

    const doc = await ServiceRequest.create({
      prescripteurId: uid(req),
      title: title.trim(),
      description: description?.trim() || "",
      trade,
      city: city?.trim() || "",
      budgetTND: Number(budgetTND) || 0,
      deadline: deadline ? new Date(deadline) : null,
      maxApplicants: maxApplicants ? Number(maxApplicants) : null,
    });

    return res.status(201).json({ ok: true, serviceRequest: doc });
  } catch (err) {
    return next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const items = await ServiceRequest.find({ prescripteurId: uid(req) })
      .sort({ createdAt: -1 })
      .populate("assignedArtisanId", "firstName lastName email")
      .lean();
    return res.json({ ok: true, items });
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const doc = await ServiceRequest.findOne({ _id: req.params.id, prescripteurId: uid(req) })
      .populate("assignedArtisanId", "firstName lastName email profilePicture")
      .populate("applications.artisanId", "firstName lastName email profilePicture")
      .lean();
    if (!doc) return res.status(404).json({ message: "Not found" });

    // Enrich each application with the artisan's profile image (stored in ArtisanProfile, not User)
    const artisanIds = doc.applications.map(a => a.artisanId?._id).filter(Boolean);
    const profiles = await ArtisanProfile.find({ userId: { $in: artisanIds } })
      .select("userId profileImage")
      .lean();
    const profileMap = {};
    profiles.forEach(p => { profileMap[String(p.userId)] = p.profileImage; });

    const enrichedApplications = doc.applications.map(app => ({
      ...app,
      artisanId: app.artisanId
        ? {
            ...app.artisanId,
            // prefer ArtisanProfile.profileImage, fall back to User.profilePicture
            profilePicture: profileMap[String(app.artisanId._id)] || app.artisanId.profilePicture || "",
          }
        : app.artisanId,
    }));

    return res.json({ ok: true, serviceRequest: { ...doc, applications: enrichedApplications } });
  } catch (err) {
    return next(err);
  }
}

  async function update(req, res, next) {
    try {
      const doc = await ServiceRequest.findOne({ _id: req.params.id, prescripteurId: uid(req) });
      if (!doc) return res.status(404).json({ message: "Not found" });
      if (doc.status !== "OPEN") return res.status(400).json({ message: "Only OPEN requests can be edited" });

      const { title, description, trade, city, budgetTND, deadline, maxApplicants } = req.body || {};
      if (title !== undefined) doc.title = title.trim();
      if (description !== undefined) doc.description = description.trim();
      if (trade !== undefined) doc.trade = trade;
      if (city !== undefined) doc.city = city.trim();
      if (budgetTND !== undefined) doc.budgetTND = Number(budgetTND) || 0;
      if (deadline !== undefined) doc.deadline = deadline ? new Date(deadline) : null;
      if (maxApplicants !== undefined) doc.maxApplicants = maxApplicants ? Number(maxApplicants) : null;

      await doc.save();
      return res.json({ ok: true, serviceRequest: doc });
    } catch (err) {
      return next(err);
    }
  }

async function remove(req, res, next) {
  try {
    const doc = await ServiceRequest.findOne({ _id: req.params.id, prescripteurId: uid(req) });
    if (!doc) return res.status(404).json({ message: "Not found" });
    await ServiceRequest.deleteOne({ _id: doc._id });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

async function changeStatus(req, res, next) {
  try {
    const { status } = req.body || {};
    const allowed = ["CANCELLED", "COMPLETED"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(", ")}` });
    }

    const doc = await ServiceRequest.findOne({ _id: req.params.id, prescripteurId: uid(req) });
    if (!doc) return res.status(404).json({ message: "Not found" });

    doc.status = status;
    await doc.save();
    return res.json({ ok: true, serviceRequest: doc });
  } catch (err) {
    return next(err);
  }
}

async function acceptApplication(req, res, next) {
  try {
    const doc = await ServiceRequest.findOne({ _id: req.params.id, prescripteurId: uid(req) });
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (doc.status !== "OPEN") return res.status(400).json({ message: "Request is no longer open" });

    const app = doc.applications.id(req.params.appId);
    if (!app) return res.status(404).json({ message: "Application not found" });

    // Accept this one, reject all others
    doc.applications.forEach((a) => {
      a.status = String(a._id) === String(app._id) ? "ACCEPTED" : "REJECTED";
    });
    doc.status = "ASSIGNED";
    doc.assignedArtisanId = app.artisanId;

    await doc.save();

    // Notify accepted artisan
    await notify({
      userId: app.artisanId,
      type: "APPLICATION_ACCEPTED",
      title: "Candidature acceptée !",
      message: `Votre candidature pour "${doc.title}" a été acceptée.`,
      link: `/artisan/service-requests`,
    });

    // Email (fire-and-forget)
    const artisan = await User.findById(app.artisanId).select("firstName lastName email").lean();
    if (artisan) sendApplicationAcceptedEmail(artisan, doc).catch(() => {});

    return res.json({ ok: true, serviceRequest: doc });
  } catch (err) {
    return next(err);
  }
}

async function rejectApplication(req, res, next) {
  try {
    const doc = await ServiceRequest.findOne({ _id: req.params.id, prescripteurId: uid(req) });
    if (!doc) return res.status(404).json({ message: "Not found" });

    const app = doc.applications.id(req.params.appId);
    if (!app) return res.status(404).json({ message: "Application not found" });

    app.status = "REJECTED";
    await doc.save();

    // Notify rejected artisan
    await notify({
      userId: app.artisanId,
      type: "APPLICATION_REJECTED",
      title: "Candidature non retenue",
      message: `Votre candidature pour "${doc.title}" n'a pas été retenue.`,
      link: `/artisan/service-requests`,
    });

    return res.json({ ok: true, serviceRequest: doc });
  } catch (err) {
    return next(err);
  }
}

// ─── ARTISAN ─────────────────────────────────────────────────────────────────

async function listOpen(req, res, next) {
  try {
    const { trade, city, page = 1, limit = 10 } = req.query;

    // Auto-filter by artisan's trade if not specified
    let tradeFilter = trade;
    if (!tradeFilter) {
      const profile = await ArtisanProfile.findOne({ userId: uid(req) }).lean();
      if (profile?.trade) tradeFilter = profile.trade;
    }

    const filter = { status: "OPEN" };
    if (tradeFilter) filter.trade = tradeFilter;
    if (city) filter.city = new RegExp(city, "i");

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      ServiceRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("prescripteurId", "firstName lastName profilePicture")
        .lean(),
      ServiceRequest.countDocuments(filter),
    ]);

    // Mark which ones the current artisan already applied to
    const artisanId = String(uid(req));
    const enriched = items.map((item) => ({
      ...item,
      prescripteur: item.prescripteurId,   // remap so frontend reads item.prescripteur
      prescripteurId: undefined,
      hasApplied: item.applications?.some((a) => String(a.artisanId) === artisanId) || false,
      applicationsCount: item.applications?.length || 0,
      applications: undefined,
    }));
    return res.json({ ok: true, items: enriched, total, page: Number(page) });
  } catch (err) {
    return next(err);
  }
}

async function getOpenOne(req, res, next) {
  try {
    // Allow viewing OPEN and ASSIGNED requests (artisan may want to see their accepted request)
    const doc = await ServiceRequest.findOne({
      _id: req.params.id,
      status: { $in: ["OPEN", "ASSIGNED", "COMPLETED"] }
    })
      .populate("prescripteurId", "firstName lastName profilePicture")
      .lean();
    if (!doc) return res.status(404).json({ message: "Not found" });

    const artisanId = String(uid(req));
    const myApp = doc.applications?.find((a) => String(a.artisanId) === artisanId);

    return res.json({
      ok: true,
      serviceRequest: {
        ...doc,
        prescripteur: doc.prescripteurId,
        hasApplied: !!myApp,
        myApplication: myApp || null,
        applicationsCount: doc.applications?.length || 0,
        applications: undefined,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function apply(req, res, next) {
  try {
    const artisanId = uid(req);
    const doc = await ServiceRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (doc.status !== "OPEN") return res.status(400).json({ message: "This request is no longer open" });

    const alreadyApplied = doc.applications.some((a) => String(a.artisanId) === String(artisanId));
    if (alreadyApplied) return res.status(409).json({ message: "You already applied to this request" });

    // Check max applicants limit
    if (doc.maxApplicants !== null && doc.applications.length >= doc.maxApplicants) {
      return res.status(400).json({ message: `Cette demande a atteint le nombre maximum de candidats (${doc.maxApplicants})` });
    }

    const { message, proposedPrice } = req.body || {};
    doc.applications.push({
      artisanId,
      message: message?.trim() || "",
      proposedPrice: proposedPrice ? Number(proposedPrice) : null,
    });

    await doc.save();

    // ── #4 Email notification to prescripteur ────────────────────────────────
    const [prescripteur, artisan] = await Promise.all([
      User.findById(doc.prescripteurId).select("firstName lastName email").lean(),
      User.findById(artisanId).select("firstName lastName").lean(),
    ]);

    // In-app notification
    await notify({
      userId: doc.prescripteurId,
      type: "APPLICATION_RECEIVED",
      title: "Nouvelle candidature",
      message: "Un artisan a postulé à votre demande de service.",
      link: `/prescripteur/service-requests`,
    });

    // Email (fire-and-forget)
    if (prescripteur && artisan) {
      sendApplicationReceivedEmail(prescripteur, artisan, doc).catch(() => {});
    }

    // ── #2 Availability warning ───────────────────────────────────────────────
    let availabilityWarning = null;
    if (doc.deadline) {
      const deadlineDay = new Date(doc.deadline);
      deadlineDay.setHours(0, 0, 0, 0);
      const nextDay = new Date(deadlineDay);
      nextDay.setDate(nextDay.getDate() + 1);

      const avail = await Availability.findOne({
        artisanId,
        date: { $gte: deadlineDay, $lt: nextDay },
      }).lean();

      if (avail && avail.status !== "AVAILABLE") {
        availabilityWarning = avail.status === "BOOKED"
          ? "Attention : vous êtes marqué non disponible à la date limite de cette demande."
          : "Attention : vous êtes marqué occupé à la date limite de cette demande.";
      }
    }

    return res.status(201).json({ ok: true, message: "Application submitted", availabilityWarning });
  } catch (err) {
    return next(err);
  }
}

async function withdraw(req, res, next) {
  try {
    const artisanId = String(uid(req));
    const doc = await ServiceRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (doc.status !== "OPEN") return res.status(400).json({ message: "Cannot withdraw from a non-open request" });

    const appIndex = doc.applications.findIndex(a => String(a.artisanId) === artisanId);
    if (appIndex === -1) return res.status(404).json({ message: "No application found" });
    if (doc.applications[appIndex].status !== "PENDING") {
      return res.status(400).json({ message: "Cannot withdraw an accepted or rejected application" });
    }

    doc.applications.splice(appIndex, 1);
    await doc.save();
    return res.json({ ok: true, message: "Application withdrawn" });
  } catch (err) {
    return next(err);
  }
}

async function myApplications(req, res, next) {
  try {
    const artisanId = String(uid(req));
    const docs = await ServiceRequest.find({
      "applications.artisanId": artisanId,
    })
      .populate("prescripteurId", "firstName lastName profilePicture")
      .lean();

    // Get all reviews this artisan already left for these service requests
    const Review = require('../../models/Review');
    const reviewedSourceIds = new Set(
      (await Review.find({ authorId: artisanId, targetType: 'PRESCRIPTEUR' }).select('sourceId').lean())
        .map(r => String(r.sourceId))
    );

    const items = docs.map((doc) => {
      const myApp = doc.applications.find((a) => String(a.artisanId) === artisanId);
      return {
        _id: doc._id,
        title: doc.title,
        trade: doc.trade,
        city: doc.city,
        budgetTND: doc.budgetTND,
        deadline: doc.deadline,
        status: doc.status,
        prescripteur: doc.prescripteurId,   // remap so frontend reads item.prescripteur
        application: myApp,
        alreadyReviewed: reviewedSourceIds.has(String(doc._id)),
        createdAt: doc.createdAt,
      };
    });

    return res.json({ ok: true, items });
  } catch (err) {
    return next(err);
  }
}

// ── #3 Re-open a cancelled request ───────────────────────────────────────────
async function reopen(req, res, next) {
  try {
    const doc = await ServiceRequest.findOne({ _id: req.params.id, prescripteurId: uid(req) });
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (doc.status !== "CANCELLED") {
      return res.status(400).json({ message: "Only CANCELLED requests can be re-opened" });
    }
    // If the deadline has already passed, clear it so it doesn't get auto-cancelled again immediately
    if (doc.deadline && doc.deadline < new Date()) {
      doc.deadline = null;
    }
    doc.status = "OPEN";
    await doc.save();
    return res.json({ ok: true, serviceRequest: doc });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  create, listMine, getOne, update, remove, changeStatus, reopen,
  acceptApplication, rejectApplication,
  listOpen, getOpenOne, apply, withdraw, myApplications,
};
