const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const statusMediaUpload = require("../middleware/statusMediaUpload");

const {
  createStatus,
  uploadStatusMedia,
  getStatuses,
  viewStatus,
  getStatusViewers,
} = require("../controllers/statusController");

/*
 * Upload status image/video
 */
router.post(
  "/media",
  authMiddleware,
  statusMediaUpload.single("file"),
  uploadStatusMedia
);

/*
 * Create status
 */
router.post(
  "/",
  authMiddleware,
  createStatus
);

/*
 * Get active statuses
 */
router.get(
  "/",
  authMiddleware,
  getStatuses
);

/*
 * Mark status as viewed
 */
router.post(
  "/:status_id/view",
  authMiddleware,
  viewStatus
);

/*
 * Get viewers of my statuses
 */
router.get(
  "/viewers",
  authMiddleware,
  getStatusViewers
);

module.exports = router;
