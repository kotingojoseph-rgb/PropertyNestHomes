const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const propertyValidation = require("../middleware/propertyValidation");

const {
  createProperty,
  getAllProperties,
  getPropertyById,
  getMyProperties,
  updateProperty,
  deleteProperty,
  uploadPropertyImage,
  getPropertyImages,
  setCoverImage,
  uploadPropertyDocument,
  getPropertyDocuments
} = require("../controllers/propertyController");


// =========================
// PRIVATE ROUTES
// =========================

router.get(
  "/my-properties",
  authMiddleware,
  getMyProperties
);


// =========================
// PUBLIC ROUTES
// =========================

router.get(
  "/",
  getAllProperties
);


router.get(
  "/:id/images",
  getPropertyImages
);


router.get(
  "/:id/documents",
  getPropertyDocuments
);


router.get(
  "/:id",
  getPropertyById
);


// =========================
// PROTECTED PROPERTY ACTIONS
// =========================

router.post(
  "/",
  authMiddleware,
  propertyValidation,
  createProperty
);


router.put(
  "/:id",
  authMiddleware,
  propertyValidation,
  updateProperty
);


router.delete(
  "/:id",
  authMiddleware,
  deleteProperty
);


// =========================
// PROPERTY IMAGES
// =========================

router.post(
  "/:id/images",
  authMiddleware,
  upload.array("images", 10),
  uploadPropertyImage
);


router.patch(
  "/:id/images/:imageId/cover",
  authMiddleware,
  setCoverImage
);


// =========================
// PROPERTY DOCUMENTS
// =========================

router.post(
  "/:id/documents",
  authMiddleware,
  upload.single("document"),
  uploadPropertyDocument
);


module.exports = router;
