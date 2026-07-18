const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const { register, login } = require("../controllers/authController");

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many login attempts. Please try again in 15 minutes.",
  },
});

// Registration rate limiter
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many registration attempts. Please try again later.",
  },
});

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);

module.exports = router;
