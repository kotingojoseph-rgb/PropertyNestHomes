const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  setupTwoFactor,
  verifyTwoFactor,
  verifyLoginTwoFactor,
  disableTwoFactor,
} = require("../controllers/twoFactorController");

/*
 * Login 2FA verification.
 *
 * This route intentionally does NOT use authMiddleware because
 * the user does not have a full JWT yet.
 */
router.post(
  "/login-verify",
  verifyLoginTwoFactor
);

/*
 * Account 2FA management.
 *
 * These routes require the normal authenticated JWT.
 */
router.post(
  "/setup",
  authMiddleware,
  setupTwoFactor
);

router.post(
  "/verify",
  authMiddleware,
  verifyTwoFactor
);

router.post(
  "/disable",
  authMiddleware,
  disableTwoFactor
);

module.exports = router;
