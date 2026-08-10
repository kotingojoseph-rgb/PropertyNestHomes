require("dotenv").config();

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");
      return res.status(500).json({
        error: "Server configuration error",
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Authorization header is required",
      });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        error: "Invalid authorization format",
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // A 2FA challenge is NOT an authenticated access token.
    if (decoded.type === "2fa_pending") {
      return res.status(401).json({
        error: "Two-factor authentication is required",
      });
    }

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
