const Project = require('../../models/Project');
const { uploadBufferToCloudinary } = require('../../config/cloudinary');

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

async function createProject(req, res, next) {
  try {
    const {
      title,
      status,
      description,
      category,
      city,
      address,
      budgetTND,
      surfaceM2,
      latitude,
      longitude,
      startDate,
      endDate,
      phoneNumber,
      contactPhone,
      materials,
    } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Le titre est requis' });
    }

    const images = await mapFilesToImages(req);

    const doc = await Project.create({
      artisanId: getUserId(req),
      title: title.trim(),
      ...(status ? { status } : {}),
      ...(description !== undefined ? { description: String(description).trim() } : {}),
      ...(category !== undefined ? { category: String(category).trim() } : {}),
      location: {
        city: city ? String(city).trim() : '',
        address: address ? String(address).trim() : '',
        latitude: toNumber(latitude) !== undefined ? toNumber(latitude) : null,
        longitude: toNumber(longitude) !== undefined ? toNumber(longitude) : null,
      },
      ...(toNumber(budgetTND) !== undefined ? { budgetTND: toNumber(budgetTND) } : {}),
      ...(toNumber(surfaceM2) !== undefined ? { surfaceM2: toNumber(surfaceM2) } : {}),
      ...(toDate(startDate) ? { startDate: toDate(startDate) } : {}),
      ...(toDate(endDate) ? { endDate: toDate(endDate) } : {}),
      contactPhone: (contactPhone ?? phoneNumber ?? '').toString().trim(),
      client: {
        name: '',
        phone: (contactPhone ?? phoneNumber ?? '').toString().trim(),
      },
      ...(materials ? { materials: toStringArray(materials) } : {}),
      ...(images.length ? { images } : {}),
    });

    const created = await Project.findById(doc._id)
      .populate('artisanId', 'firstName lastName email role')
      .lean();

    const response = { ok: true, project: created };
    
    if (req.isTrialAttempt) {
      response.trialInfo = {
        isTrialAttempt: true,
        message: 'Ceci est votre essai gratuit pour créer des projets. Vous devez vous abonner pour créer d\'autres projets.',
      };
    }

    return res.status(201).json(response);
  } catch (err) {
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
    const {
      title,
      status,
      description,
      category,
      city,
      address,
      budgetTND,
      surfaceM2,
      latitude,
      longitude,
      startDate,
      endDate,
      phoneNumber,
      contactPhone,
      materials,
      clearImages,
    } = req.body || {};

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Projet introuvable' });

    if (String(project.artisanId) !== String(getUserId(req))) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: 'Le titre doit être une chaîne non vide' });
      }
      project.title = title.trim();
    }
    if (status !== undefined) {
      project.status = status;
    }

    if (description !== undefined) project.description = String(description).trim();
    if (category !== undefined) project.category = String(category).trim();

    if (city !== undefined || address !== undefined || latitude !== undefined || longitude !== undefined) {
      project.location = {
        city: city !== undefined ? String(city).trim() : (project.location?.city || ''),
        address: address !== undefined ? String(address).trim() : (project.location?.address || ''),
        latitude: latitude !== undefined ? (toNumber(latitude) !== undefined ? toNumber(latitude) : null) : (project.location?.latitude ?? null),
        longitude: longitude !== undefined ? (toNumber(longitude) !== undefined ? toNumber(longitude) : null) : (project.location?.longitude ?? null),
      };
    }

    const b = toNumber(budgetTND);
    if (budgetTND !== undefined && b === undefined) return res.status(400).json({ message: 'budgetTND doit être un nombre' });
    if (b !== undefined) project.budgetTND = b;

    const s = toNumber(surfaceM2);
    if (surfaceM2 !== undefined && s === undefined) return res.status(400).json({ message: 'surfaceM2 doit être un nombre' });
    if (s !== undefined) project.surfaceM2 = s;

    const sd = toDate(startDate);
    if (startDate !== undefined && !sd) return res.status(400).json({ message: 'startDate doit être une date valide' });
    if (sd) project.startDate = sd;

    const ed = toDate(endDate);
    if (endDate !== undefined && !ed) return res.status(400).json({ message: 'endDate doit être une date valide' });
    if (ed) project.endDate = ed;

    if (contactPhone !== undefined || phoneNumber !== undefined) {
      const ph = (contactPhone ?? phoneNumber ?? '').toString().trim();
      project.contactPhone = ph;
      if (project.client) project.client.phone = ph;
    }

    if (materials !== undefined) project.materials = toStringArray(materials);

    if (String(clearImages).toLowerCase() === 'true') {
      project.images = [];
    }
    const newImages = await mapFilesToImages(req);
    if (newImages.length) {
      project.images = [...(project.images || []), ...newImages].slice(0, 12);
    }

    await project.save();

    const saved = await Project.findById(project._id)
      .populate('artisanId', 'firstName lastName email role')
      .lean();

    return res.json({ ok: true, project: saved });
  } catch (err) {
    return next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Projet introuvable' });

    if (String(project.artisanId) !== String(getUserId(req))) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    await Project.deleteOne({ _id: project._id });
    return res.json({ ok: true });
  } catch (err) {
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