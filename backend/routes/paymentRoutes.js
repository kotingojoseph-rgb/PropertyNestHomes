const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  initializePayment,
  initializeInvestmentPayment,
  verifyPayment,
  getPayments,
  getRevenue,
} = require("../controllers/paymentController");

router.post(
  "/initialize",
  authMiddleware,
  initializePayment
);

router.post(
  "/investment/initialize",
  authMiddleware,
  initializeInvestmentPayment
);

router.get(
  "/verify/:reference",
  authMiddleware,
  verifyPayment
);

router.get(
  "/",
  authMiddleware,
  getPayments
);

router.get(
  "/revenue",
  authMiddleware,
  getRevenue
);

module.exports = router;
