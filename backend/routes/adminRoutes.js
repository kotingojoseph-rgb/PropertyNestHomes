const express = require("express");
const router = express.Router();

const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getWallet,
  createWithdrawal,
  getWithdrawals,
  getPendingProperties,
  approveProperty,
  rejectProperty
} = require("../controllers/adminController");


// Protect all admin routes
router.use(adminMiddleware);


router.get("/wallet", getWallet);

router.post("/withdraw", createWithdrawal);

router.get("/withdrawals", getWithdrawals);


router.get("/properties/pending", getPendingProperties);

router.patch("/properties/:id/approve", approveProperty);

router.patch("/properties/:id/reject", rejectProperty);

module.exports = router;
