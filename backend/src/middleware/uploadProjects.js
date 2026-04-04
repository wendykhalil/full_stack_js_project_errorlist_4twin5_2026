const multer = require('multer');

const storage = multer.memoryStorage();

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
    fileSize: 5 * 1024 * 1024,
  },
}).array('images', 6);

module.exports = { uploadProjectImages };
