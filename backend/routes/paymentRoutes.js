const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  initializePayment,
  verifyPayment,
  getPayments,
  getRevenue,
} = require("../controllers/paymentController");

router.post(
  "/initialize",
  authMiddleware,
  initializePayment
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
