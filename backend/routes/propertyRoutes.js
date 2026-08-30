const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload");
const propertyValidation = require("../middleware/propertyValidation");

const verifyPropertyOwner = async (req, res, next) => {
  try {
    const pool = require("../config/db");

    const result = await pool.query(
      `SELECT owner_id FROM properties WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found",
      });
    }

    const ownerId = Number(result.rows[0].owner_id);
    const userId = Number(req.user.id);
    const isAdmin = String(req.user.role || "").toLowerCase() === "admin";

    if (!isAdmin && ownerId !== userId) {
      return res.status(403).json({
        message: "You are not authorized to upload files for this property",
      });
    }

    next();
  } catch (error) {
    console.error("verifyPropertyOwner error:", error);

    return res.status(500).json({
      message: "Unable to verify property ownership",
    });
  }
};

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
  getPropertyDocuments,
} = require("../controllers/propertyController");

// =========================
// PRIVATE ROUTES
// =========================

router.get(
  "/:id/documents",
  authMiddleware,
  getPropertyDocuments
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

// =========================
// MY PROPERTIES
// =========================

router.get(
  "/my-properties",
  authMiddleware,
  getMyProperties
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
  verifyPropertyOwner,
  ...upload.array("images", 10),
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
  verifyPropertyOwner,
  ...upload.single("document"),
  uploadPropertyDocument
);

module.exports = router;
