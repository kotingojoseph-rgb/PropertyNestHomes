const express = require("express");
const router = express.Router();

const adminMiddleware = require("../middleware/adminMiddleware");

const {
  createPromotion,
  getPromotions,
} = require("../controllers/promotionController");

router.post(
  "/",
  adminMiddleware,
  createPromotion
);

router.get(
  "/",
  getPromotions
);

module.exports = router;
