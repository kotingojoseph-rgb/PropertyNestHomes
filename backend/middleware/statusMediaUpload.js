const multer = require("multer");

const ALLOWED_VIDEO = new Set([
  "video/webm",
  "video/mp4",
  "video/quicktime",
  "video/mov",
]);

const ALLOWED_IMAGE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 30 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const mimeType = String(file.mimetype || "")
      .toLowerCase()
      .split(";")[0]
      .trim();

    if (
      ALLOWED_IMAGE.has(mimeType) ||
      ALLOWED_VIDEO.has(mimeType)
    ) {
      return cb(null, true);
    }

    console.warn(
      `Rejected status media: ${file.originalname} (${file.mimetype})`
    );

    return cb(
      new Error(
        `Unsupported status media type: ${
          file.mimetype || "unknown"
        }`
      )
    );
  },
});

module.exports = upload;
