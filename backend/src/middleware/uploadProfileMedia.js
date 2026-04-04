const multer = require('multer');

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

function fileFilter(_req, file, cb) {
  if (allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error('Only JPG, PNG, GIF and WEBP images are allowed'));
}

const uploadProfileMedia = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
}).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'profilePicture', maxCount: 1 },
]);

module.exports = { uploadProfileMedia };
