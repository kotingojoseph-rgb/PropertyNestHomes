const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  submitContactMessage,
} = require("../controllers/contactController");

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many contact requests. Please try again later.",
  },
});

router.post(
  "/",
  contactLimiter,
  submitContactMessage
);

module.exports = router;
