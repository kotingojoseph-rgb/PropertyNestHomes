const express = require("express");
const router = express.Router();

const {
  initializePayment,
  verifyPayment,
  getPayments,
  getRevenue
} = require("../controllers/paymentController");


// Start Paystack payment
router.post("/initialize", initializePayment);


// Verify Paystack payment
router.get("/verify/:reference", verifyPayment);


// Payment history
router.get("/", getPayments);


// Revenue summary
router.get("/revenue", getRevenue);


module.exports = router;
