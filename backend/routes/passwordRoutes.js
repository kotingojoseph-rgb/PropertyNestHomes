const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  forgotPassword,
  resetPassword,
} = require("../controllers/passwordController");

const router = express.Router();

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Too many password reset requests. Please try again later.",
  },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Too many password reset attempts. Please try again later.",
  },
});

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  forgotPassword
);

router.post(
  "/reset-password/:token",
  resetPasswordLimiter,
  resetPassword
);

module.exports = router;
