const Project = require('../../models/Project');
const { uploadBufferToCloudinary } = require('../../config/cloudinary');

// ── Helper functions ──────────────────────────────────────────────────────────
function getUserId(req) {
  return req.user?._id || req.user?.id || req.user?.sub || req.user?.userId;
}

function toNumber(v) {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toDate(v) {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toStringArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  return String(v).split(',').map((s) => s.trim()).filter(Boolean);
}

async function mapFilesToImages(req) {
  const files = req.files || [];
  const results = [];
  for (const f of files) {
    const uploaded = await uploadBufferToCloudinary(f.buffer, {
      folder: 'bmp/projects/images',
      resourceType: 'image',
    });
    results.push({
      url: uploaded.secure_url,
      filename: uploaded.public_id || '',
      originalName: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
    });
  }
  return results;
}

// ── Validation helpers ────────────────────────────────────────────────────────
function validateTitle(title) {
  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new Error('Le titre est requis');
  }
  return title.trim();
}

function buildLocationObject(city, address, latitude, longitude) {
  return {
    city: city ? String(city).trim() : '',
    address: address ? String(address).trim() : '',
    latitude: toNumber(latitude) !== undefined ? toNumber(latitude) : null,
    longitude: toNumber(longitude) !== undefined ? toNumber(longitude) : null,
  };
}

function buildProjectData(req, body, images, userId) {
  const {
    title, status, description, category, city, address,
    budgetTND, surfaceM2, latitude, longitude, startDate, endDate,
    phoneNumber, contactPhone, materials,
  } = body;

  const validatedTitle = validateTitle(title);
  const contact = (contactPhone ?? phoneNumber ?? '').toString().trim();

  return {
    artisanId: userId,
    title: validatedTitle,
    ...(status ? { status } : {}),
    ...(description !== undefined ? { description: String(description).trim() } : {}),
    ...(category !== undefined ? { category: String(category).trim() } : {}),
    location: buildLocationObject(city, address, latitude, longitude),
    ...(toNumber(budgetTND) !== undefined ? { budgetTND: toNumber(budgetTND) } : {}),
    ...(toNumber(surfaceM2) !== undefined ? { surfaceM2: toNumber(surfaceM2) } : {}),
    ...(toDate(startDate) ? { startDate: toDate(startDate) } : {}),
    ...(toDate(endDate) ? { endDate: toDate(endDate) } : {}),
    contactPhone: contact,
    client: { name: '', phone: contact },
    ...(materials ? { materials: toStringArray(materials) } : {}),
    ...(images.length ? { images } : {}),
  };
}

function buildTrialResponse(response, req) {
  if (req.isTrialAttempt) {
    response.trialInfo = {
      isTrialAttempt: true,
      message: "Ceci est votre essai gratuit pour créer des projets. Vous devez vous abonner pour créer d'autres projets.",
    };
  }
  return response;
}

// ── Update helpers ───────────────────────────────────────────────────────────
async function validateProjectOwnership(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Projet introuvable');
    error.statusCode = 404;
    throw error;
  }
  if (String(project.artisanId) !== String(userId)) {
    const error = new Error('Accès interdit');
    error.statusCode = 403;
    throw error;
  }
  return project;
}

function updateBasicFields(project, body) {
  const { title, status, description, category } = body;
  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      const error = new Error('Le titre doit être une chaîne non vide');
      error.statusCode = 400;
      throw error;
    }
    project.title = title.trim();
  }
  if (status !== undefined) project.status = status;
  if (description !== undefined) project.description = String(description).trim();
  if (category !== undefined) project.category = String(category).trim();
}

function updateLocation(project, body) {
  const { city, address, latitude, longitude } = body;
  if (city !== undefined || address !== undefined || latitude !== undefined || longitude !== undefined) {
    project.location = {
      city: city !== undefined ? String(city).trim() : (project.location?.city || ''),
      address: address !== undefined ? String(address).trim() : (project.location?.address || ''),
      latitude: latitude !== undefined ? (toNumber(latitude) !== undefined ? toNumber(latitude) : null) : (project.location?.latitude ?? null),
      longitude: longitude !== undefined ? (toNumber(longitude) !== undefined ? toNumber(longitude) : null) : (project.location?.longitude ?? null),
    };
  }
}

function updateNumericFields(project, body) {
  const { budgetTND, surfaceM2 } = body;
  const b = toNumber(budgetTND);
  if (budgetTND !== undefined && b === undefined) {
    const error = new Error('budgetTND doit être un nombre');
    error.statusCode = 400;
    throw error;
  }
  if (b !== undefined) project.budgetTND = b;

  const s = toNumber(surfaceM2);
  if (surfaceM2 !== undefined && s === undefined) {
    const error = new Error('surfaceM2 doit être un nombre');
    error.statusCode = 400;
    throw error;
  }
  if (s !== undefined) project.surfaceM2 = s;
}

function updateDateFields(project, body) {
  const { startDate, endDate } = body;
  const sd = toDate(startDate);
  if (startDate !== undefined && !sd) {
    const error = new Error('startDate doit être une date valide');
    error.statusCode = 400;
    throw error;
  }
  if (sd) project.startDate = sd;

  const ed = toDate(endDate);
  if (endDate !== undefined && !ed) {
    const error = new Error('endDate doit être une date valide');
    error.statusCode = 400;
    throw error;
  }
  if (ed) project.endDate = ed;
}

function updateContactAndMaterials(project, body) {
  const { phoneNumber, contactPhone, materials } = body;
  if (contactPhone !== undefined || phoneNumber !== undefined) {
    const ph = (contactPhone ?? phoneNumber ?? '').toString().trim();
    project.contactPhone = ph;
    if (project.client) project.client.phone = ph;
  }
  if (materials !== undefined) project.materials = toStringArray(materials);
}

// ⚠️ CORRECTION ICI : ajout du mot-clé "async"
async function updateImages(project, body, req) {
  const { clearImages } = body;
  if (String(clearImages).toLowerCase() === 'true') {
    project.images = [];
  }
  const newImages = await mapFilesToImages(req);
  if (newImages.length) {
    project.images = [...(project.images || []), ...newImages].slice(0, 12);
  }
}

// ── Controller functions ──────────────────────────────────────────────────────
async function createProject(req, res, next) {
  try {
    const userId = getUserId(req);
    const body = req.body || {};
    const images = await mapFilesToImages(req);
    const projectData = buildProjectData(req, body, images, userId);
    const doc = await Project.create(projectData);
    const created = await Project.findById(doc._id)
      .populate('artisanId', 'firstName lastName email role')
      .lean();
    let response = { ok: true, project: created };
    response = buildTrialResponse(response, req);
    return res.status(201).json(response);
  } catch (err) {
    if (err.message === 'Le titre est requis') {
      return res.status(400).json({ message: err.message });
    }
    return next(err);
  }
}

async function listMyProjects(req, res, next) {
  try {
    const items = await Project.find({ artisanId: getUserId(req) })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ ok: true, items });
  } catch (err) {
    return next(err);
  }
}

async function listAllProjects(req, res, next) {
  try {
    const items = await Project.find()
      .sort({ createdAt: -1 })
      .populate('artisanId', 'firstName lastName email role')
      .lean();
    return res.json({ ok: true, items });
  } catch (err) {
    return next(err);
  }
}

async function getProjectById(req, res, next) {
  try {
    const project = await Project.findById(req.params.id)
      .populate('artisanId', 'firstName lastName email role')
      .lean();
    if (!project) return res.status(404).json({ message: 'Projet introuvable' });
    const role = req.user?.role;
    if (role === 'ARTISAN' && String(project.artisanId?._id || project.artisanId) !== String(getUserId(req))) {
      return res.status(403).json({ message: 'Accès interdit' });
    }
    return res.json({ ok: true, project });
  } catch (err) {
    return next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const userId = getUserId(req);
    const body = req.body || {};
    const project = await validateProjectOwnership(req.params.id, userId);
    updateBasicFields(project, body);
    updateLocation(project, body);
    updateNumericFields(project, body);
    updateDateFields(project, body);
    updateContactAndMaterials(project, body);
    await updateImages(project, body, req);
    await project.save();
    const saved = await Project.findById(project._id)
      .populate('artisanId', 'firstName lastName email role')
      .lean();
    return res.json({ ok: true, project: saved });
  } catch (err) {
    if (err.statusCode === 400) return res.status(400).json({ message: err.message });
    if (err.statusCode === 403) return res.status(403).json({ message: err.message });
    if (err.statusCode === 404) return res.status(404).json({ message: err.message });
    return next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const userId = getUserId(req);
    const project = await validateProjectOwnership(req.params.id, userId);
    await Project.deleteOne({ _id: project._id });
    return res.json({ ok: true });
  } catch (err) {
    if (err.statusCode === 403) return res.status(403).json({ message: err.message });
    if (err.statusCode === 404) return res.status(404).json({ message: err.message });
    return next(err);
  }
}

module.exports = {
  createProject,
  listMyProjects,
  listAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};