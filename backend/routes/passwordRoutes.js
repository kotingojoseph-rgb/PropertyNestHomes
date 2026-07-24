const express = require("express");

const router = express.Router();

const {
  forgotPassword,
  resetPassword
} = require("../controllers/passwordController");


// Request password reset
router.post(
  "/forgot-password",
  forgotPassword
);


// Reset password with token
router.post(
  "/reset-password/:token",
  resetPassword
);


module.exports = router;
