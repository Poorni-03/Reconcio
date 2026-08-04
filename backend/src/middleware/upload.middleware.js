const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || "./uploads");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const maxSizeMb = parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10;

const upload = multer({
  storage,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
});

module.exports = { upload };