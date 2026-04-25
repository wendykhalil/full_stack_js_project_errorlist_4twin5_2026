const Review = require("../../models/Review");
const ServiceRequest = require("../../models/ServiceRequest");

// ============= UTILITAIRES =============
function uid(req) {
  return req.user?._id || req.user?.id || req.user?.sub;
}

function getUserId(req) {
  const userId = uid(req);
  if (!userId) throw new Error("Utilisateur non authentifié");
  return String(userId);
}

// ============= VALIDATEURS =============
function validateReviewInput(targetId, targetType, rating, comment) {
  if (!targetId) {
    throw { status: 400, message: "targetId est requis" };
  }
  
  if (!targetType || !["ARTISAN", "PRESCRIPTEUR"].includes(targetType)) {
    throw { status: 400, message: "targetType doit être ARTISAN ou PRESCRIPTEUR" };
  }
  
  if (!rating || rating < 1 || rating > 5) {
    throw { status: 400, message: "La note doit être comprise entre 1 et 5" };
  }
  
  if (!comment || comment.trim().length < 10) {
    throw { status: 400, message: "Le commentaire doit contenir au moins 10 caractères" };
  }
}

async function validateServiceRequest(sourceId, authorId) {
  if (!sourceId) return null;
  
  const sr = await ServiceRequest.findById(sourceId).lean();
  if (!sr) {
    throw { status: 404, message: "Demande de service introuvable" };
  }
  
  if (!['COMPLETED', 'ASSIGNED'].includes(sr.status)) {
    throw { status: 400, message: "Vous ne pouvez laisser un avis qu'après acceptation ou clôture de la demande de service" };
  }
  
  const authorStr = String(authorId);
  const isPrescrip = String(sr.prescripteurId) === authorStr;
  const isArtisan = String(sr.assignedArtisanId) === authorStr;
  
  if (!isPrescrip && !isArtisan) {
    throw { status: 403, message: "Vous ne faites pas partie de cette demande de service" };
  }
  
  return sr;
}

async function checkDuplicateReview(authorId, targetId, sourceId) {
  if (!sourceId) return false;
  
  const existingReview = await Review.findOne({
    authorId,
    targetId,
    sourceId,
  }).lean();
  
  if (existingReview) {
    throw { status: 409, message: "Vous avez déjà évalué cette demande de service" };
  }
  
  return false;
}

function preventSelfReview(authorId, targetId) {
  if (String(authorId) === String(targetId)) {
    throw { status: 400, message: "Vous ne pouvez pas vous évaluer vous-même" };
  }
}

// ============= CREATE REVIEW =============
async function create(req, res, next) {
  try {
    const authorId = uid(req);
    const { targetId, targetType, rating, title, comment, sourceId } = req.body || {};
    
    // Validations
    validateReviewInput(targetId, targetType, rating, comment);
    await validateServiceRequest(sourceId, authorId);
    preventSelfReview(authorId, targetId);
    await checkDuplicateReview(authorId, targetId, sourceId);
    
    // Create review
    const review = await Review.create({
      authorId,
      targetId,
      targetType,
      rating: Number(rating),
      title: title?.trim() || 'Avis',
      comment: comment?.trim() || "",
      sourceId: sourceId || null,
    });
    
    // Populate and return
    const populated = await Review.findById(review._id)
      .populate("authorId", "firstName lastName profilePicture role")
      .lean();
    
    return res.status(201).json({ ok: true, review: populated });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    return next(err);
  }
}

// ============= GET REVIEWS FOR USER =============
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

// ============= GET PENDING REVIEWS =============
function getServiceRequestFilter(role, userId) {
  return role === "PRESCRIPTEUR"
    ? { status: "COMPLETED", prescripteurId: userId }
    : { status: "COMPLETED", assignedArtisanId: userId };
}

function formatPendingReview(sr, role) {
  return {
    serviceRequestId: sr._id,
    title: sr.title,
    completedAt: sr.updatedAt,
    targetUser: role === "PRESCRIPTEUR"
      ? { ...sr.assignedArtisanId, targetType: "ARTISAN" }
      : { ...sr.prescripteurId, targetType: "PRESCRIPTEUR" },
  };
}

async function getPending(req, res, next) {
  try {
    const userId = getUserId(req);
    const role = req.user?.role;
    
    if (!role || !["PRESCRIPTEUR", "ARTISAN"].includes(role)) {
      return res.status(403).json({ message: "Rôle non autorisé pour cette action" });
    }
    
    // Find completed service requests
    const filter = getServiceRequestFilter(role, userId);
    const completed = await ServiceRequest.find(filter)
      .populate("prescripteurId", "firstName lastName profilePicture")
      .populate("assignedArtisanId", "firstName lastName profilePicture")
      .lean();
    
    if (completed.length === 0) {
      return res.json({ ok: true, pending: [] });
    }
    
    // Find already reviewed requests
    const alreadyReviewed = await Review.find({
      authorId: userId,
      sourceId: { $in: completed.map(sr => sr._id) },
    }).lean();
    
    const reviewedIds = new Set(alreadyReviewed.map(r => String(r.sourceId)));
    
    // Filter pending reviews
    const pending = completed
      .filter(sr => !reviewedIds.has(String(sr._id)))
      .map(sr => formatPendingReview(sr, role));
    
    return res.json({ ok: true, pending });
  } catch (err) {
    return next(err);
  }
}

// ============= DELETE REVIEW =============
async function remove(req, res, next) {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: "Introuvable" });
    }
    
    if (String(review.authorId) !== String(uid(req))) {
      return res.status(403).json({ message: "Accès interdit" });
    }
    
    await Review.deleteOne({ _id: review._id });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, getForUser, getPending, remove };