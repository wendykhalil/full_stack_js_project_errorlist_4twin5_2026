const Review = require("../../models/Review");
const ServiceRequest = require("../../models/ServiceRequest");

function uid(req) {
  return req.user?._id || req.user?.id || req.user?.sub;
}

// POST /reviews — submit a review
async function create(req, res, next) {
  try {
    const authorId = uid(req);
    const { targetId, targetType, rating, comment, sourceId } = req.body || {};

    if (!targetId) return res.status(400).json({ message: "targetId is required" });
    if (!targetType || !["ARTISAN", "PRESCRIPTEUR"].includes(targetType)) {
      return res.status(400).json({ message: "targetType must be ARTISAN or PRESCRIPTEUR" });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }

    // Verify the service request is completed and involves both users
    if (sourceId) {
      const sr = await ServiceRequest.findById(sourceId).lean();
      if (!sr) return res.status(404).json({ message: "Service request not found" });
      if (!['COMPLETED', 'ASSIGNED'].includes(sr.status)) {
        return res.status(400).json({ message: "Can only review after an accepted or completed service request" });
      }

      const authorStr = String(authorId);
      const isPrescrip = String(sr.prescripteurId) === authorStr;
      const isArtisan = String(sr.assignedArtisanId) === authorStr;

      if (!isPrescrip && !isArtisan) {
        return res.status(403).json({ message: "You were not part of this service request" });
      }
    }

    // Prevent self-review
    if (String(authorId) === String(targetId)) {
      return res.status(400).json({ message: "You cannot review yourself" });
    }

    const review = await Review.create({
      authorId,
      targetId,
      targetType,
      rating: Number(rating),
      comment: comment?.trim() || "",
      sourceId: sourceId || null,
    });

    const populated = await Review.findById(review._id)
      .populate("authorId", "firstName lastName profilePicture role")
      .lean();

    return res.status(201).json({ ok: true, review: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "You already reviewed this service request" });
    }
    return next(err);
  }
}

// GET /reviews/user/:userId — get all reviews for a user
async function getForUser(req, res, next) {
  try {
    const reviews = await Review.find({ targetId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("authorId", "firstName lastName profilePicture role")
      .lean();

    const total = reviews.length;
    const avgRating = total
      ? Number((reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1))
      : 0;

    return res.json({ ok: true, reviews, total, avgRating });
  } catch (err) {
    return next(err);
  }
}

// GET /reviews/pending — completed service requests not yet reviewed by me
async function getPending(req, res, next) {
  try {
    const userId = String(uid(req));
    const role = req.user?.role;

    // Find completed service requests involving this user
    const filter =
      role === "PRESCRIPTEUR"
        ? { status: "COMPLETED", prescripteurId: userId }
        : { status: "COMPLETED", assignedArtisanId: userId };

    const completed = await ServiceRequest.find(filter)
      .populate("prescripteurId", "firstName lastName profilePicture")
      .populate("assignedArtisanId", "firstName lastName profilePicture")
      .lean();

    // Find which ones I already reviewed
    const alreadyReviewed = await Review.find({
      authorId: userId,
      sourceId: { $in: completed.map((sr) => sr._id) },
    }).lean();

    const reviewedIds = new Set(alreadyReviewed.map((r) => String(r.sourceId)));

    const pending = completed
      .filter((sr) => !reviewedIds.has(String(sr._id)))
      .map((sr) => ({
        serviceRequestId: sr._id,
        title: sr.title,
        completedAt: sr.updatedAt,
        targetUser:
          role === "PRESCRIPTEUR"
            ? { ...sr.assignedArtisanId, targetType: "ARTISAN" }
            : { ...sr.prescripteurId, targetType: "PRESCRIPTEUR" },
      }));

    return res.json({ ok: true, pending });
  } catch (err) {
    return next(err);
  }
}

// DELETE /reviews/:id
async function remove(req, res, next) {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Not found" });
    if (String(review.authorId) !== String(uid(req))) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await Review.deleteOne({ _id: review._id });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, getForUser, getPending, remove };
