const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(process.cwd(), 'uploads', 'products');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExts = ['.png', '.jpg', '.jpeg', '.webp', '.pdf'];
    const safeExt = safeExts.includes(ext) ? ext : '.jpg';
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, name);
  },
});

function fileFilter(req, file, cb) {
  const mimetypes = {
    image: ['image/png', 'image/jpeg', 'image/webp'],
    doc: ['application/pdf']
  };
  const ok = mimetypes.image.includes(file.mimetype) || mimetypes.doc.includes(file.mimetype);
  if (!ok) return cb(new Error('Only images (png/jpg/webp) and PDF allowed.'));
  cb(null, true);
}

const uploadProductMedia = multer({
  storage,
  fileFilter,
  limits: {
    files: 10,
    fileSize: 10 * 1024 * 1024, // 10MB
  },
}).array('media', 10); // media[] for images/docs

module.exports = { uploadProductMedia, uploadDir };
