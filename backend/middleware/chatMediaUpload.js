const multer = require("multer");

const ALLOWED_AUDIO = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/x-wav",
]);

const ALLOWED_VIDEO = new Set([
  "video/webm",
  "video/mp4",
  "video/quicktime",
  "video/mov",
]);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 50 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const mimeType = String(file.mimetype || "")
      .toLowerCase()
      .split(";")[0]
      .trim();

    const normalizedMimeType =
      mimeType === "audio/x-m4a"
        ? "audio/mp4"
        : mimeType === "audio/x-wav"
        ? "audio/wav"
        : mimeType;

    if (
      ALLOWED_AUDIO.has(normalizedMimeType) ||
      ALLOWED_VIDEO.has(normalizedMimeType)
    ) {
      return cb(null, true);
    }

    console.warn(
      `Rejected chat media: ${file.originalname} (${file.mimetype})`
    );

    return cb(
      new Error(
        `Unsupported media type: ${
          file.mimetype || "unknown"
        }`
      )
    );
  },
});

module.exports = upload;
