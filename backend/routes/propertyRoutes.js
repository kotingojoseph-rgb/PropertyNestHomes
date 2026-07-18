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
} = require("../controllers/propertyController");

// =========================
// PRIVATE ROUTES
// =========================
router.get("/my-properties", authMiddleware, getMyProperties);

// =========================
// PUBLIC ROUTES
// =========================
router.get("/", getAllProperties);

router.get("/:id/images", getPropertyImages);

router.get("/:id", getPropertyById);

// =========================
// PROTECTED ACTIONS
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

router.delete("/:id", authMiddleware, deleteProperty);

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

module.exports = router;
