const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  createProperty,
  getAllProperties,
  getPropertyById,
  getMyProperties,
  updateProperty,
  deleteProperty,
  uploadPropertyImage,
  getPropertyImages,
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
router.post("/", authMiddleware, createProperty);

router.put("/:id", authMiddleware, updateProperty);

router.delete("/:id", authMiddleware, deleteProperty);

router.post(
  "/:id/images",
  authMiddleware,
  upload.single("image"),
  uploadPropertyImage
);

module.exports = router;
