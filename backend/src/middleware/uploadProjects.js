const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(process.cwd(), 'uploads', 'projects');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    // keep it simple & safe: <timestamp>-<random>.<ext>
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext) ? ext : '.jpg';
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, name);
  },
});

function fileFilter(_req, file, cb) {
  const ok = ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype);
  if (!ok) return cb(new Error('Only image files are allowed (png/jpg/webp).'));
  cb(null, true);
}

const uploadProjectImages = multer({
  storage,
  fileFilter,
  limits: {
    files: 6,
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).array('images', 6);

module.exports = { uploadProjectImages, uploadDir };
