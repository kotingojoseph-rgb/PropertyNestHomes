const express = require("express");
const router = express.Router();

const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getWallet,
  createWithdrawal,
  getWithdrawals
} = require("../controllers/adminController");


// Protect all admin routes
router.use(adminMiddleware);


router.get("/wallet", getWallet);

router.post("/withdraw", createWithdrawal);

router.get("/withdrawals", getWithdrawals);


module.exports = router;
