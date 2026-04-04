const multer = require('multer');

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const mimetypes = {
    image: ['image/png', 'image/jpeg', 'image/webp'],
    doc: ['application/pdf'],
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
    fileSize: 10 * 1024 * 1024,
  },
}).array('media', 10);

module.exports = { uploadProductMedia };
