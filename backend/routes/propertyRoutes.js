const express = require("express");
const router = express.Router();


const authMiddleware = require("../middleware/authMiddleware");

const upload = require("../middleware/upload");

const {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  uploadPropertyImage,
  getPropertyImages
} = require("../controllers/propertyController");
  
  
router.get(
  "/",
  getAllProperties           
);    router.get(
  "/:id",
  getPropertyById
);router.put(
  "/:id",
  authMiddleware,
  updateProperty
);router.delete(
  "/:id",
  authMiddleware,
  deleteProperty
); 
router.post(
  "/:id/images",
  authMiddleware,
  upload.single("image"),
  uploadPropertyImage
);
router.get(
  "/:id/images",
  getPropertyImages
);


router.post(
  "/",
  authMiddleware,
  createProperty
);

module.exports = router;
