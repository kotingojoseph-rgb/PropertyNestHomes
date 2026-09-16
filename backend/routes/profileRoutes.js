const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const { updateProfileImage } = require("../controllers/profileController");

router.post(
  "/image",
  authMiddleware,
  upload.single("profile_image"),
  updateProfileImage
);

module.exports = router;
