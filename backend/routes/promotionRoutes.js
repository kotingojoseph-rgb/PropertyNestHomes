const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createPromotion,
  getPromotions,
} = require("../controllers/promotionController");

router.post(
  "/",
  authMiddleware,
  createPromotion
);

router.get(
  "/",
  getPromotions
);

module.exports = router;
