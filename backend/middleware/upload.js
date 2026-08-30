const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
});

function normalizeMimeType(mimetype) {
  return String(mimetype || "")
    .toLowerCase()
    .split(";")[0]
    .trim();
}

function createFileFilter(allowedTypes) {
  return (req, file, cb) => {
    const mimetype = normalizeMimeType(file.mimetype);

    if (!allowedTypes.has(mimetype)) {
      return cb(
        new Error(
          `Unsupported file type: ${file.mimetype || "unknown"}`
        )
      );
    }

    cb(null, true);
  };
}

function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const mimetype = normalizeMimeType(file.mimetype);
    const isPdf = mimetype === "application/pdf";

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "propertynesthomes",
        resource_type: isPdf ? "raw" : "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });
}

const middleware = {
  array(fieldName, maxCount) {
    const imageUpload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: maxCount,
      },
      fileFilter: createFileFilter(IMAGE_TYPES),
    });

    return [
      imageUpload.array(fieldName, maxCount),

      async (req, res, next) => {
        try {
          if (!req.files || req.files.length === 0) {
            return next();
          }

          const uploadedFiles = [];

          for (const file of req.files) {
            const result = await uploadToCloudinary(file);

            uploadedFiles.push({
              ...file,
              path: result.secure_url,
              secure_url: result.secure_url,
              public_id: result.public_id,
              resource_type: result.resource_type,
            });
          }

          req.files = uploadedFiles;
          next();
        } catch (error) {
          console.error("Cloudinary upload error:", error);
          next(error);
        }
      },
    ];
  },

  single(fieldName) {
    const documentUpload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
      },
      fileFilter: createFileFilter(DOCUMENT_TYPES),
    });

    return [
      documentUpload.single(fieldName),

      async (req, res, next) => {
        try {
          if (!req.file) {
            return next();
          }

          const result = await uploadToCloudinary(req.file);

          req.file.path = result.secure_url;
          req.file.secure_url = result.secure_url;
          req.file.public_id = result.public_id;
          req.file.resource_type = result.resource_type;

          next();
        } catch (error) {
          console.error("Cloudinary upload error:", error);
          next(error);
        }
      },
    ];
  },
};

module.exports = middleware;
