const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },

  fileFilter: (req, file, cb) => {
    const mimetype = String(file.mimetype || "")
      .toLowerCase()
      .split(";")[0]
      .trim();

    if (!ALLOWED_TYPES.has(mimetype)) {
      return cb(
        new Error(`Unsupported file type: ${file.mimetype || "unknown"}`)
      );
    }

    cb(null, true);
  },
});

function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const isPdf = file.mimetype === "application/pdf";

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
    return [
      upload.array(fieldName, maxCount),

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
    return [
      upload.single(fieldName),

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
