const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const {
  generateTurnCredentials,
} = require("../services/turnService");

const router = express.Router();

router.get(
  "/turn-credentials",
  authMiddleware,
  async (req, res) => {
    try {
      const credentials =
        await generateTurnCredentials();

      return res.json(credentials);
    } catch (error) {
      console.error(
        "TURN credential generation failed:",
        error.response?.data || error.message
      );

      return res.status(502).json({
        error: "Unable to generate TURN credentials",
      });
    }
  }
);

module.exports = router;
