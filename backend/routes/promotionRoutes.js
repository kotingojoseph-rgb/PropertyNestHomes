const express = require("express");
const router = express.Router();

const {
  createPromotion,
  getPromotions
} = require("../controllers/promotionController");


router.post("/", createPromotion);

router.get("/", getPromotions);


module.exports = router;
