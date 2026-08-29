const express = require("express");
const router = express.Router();

const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getWallet,
  getWalletTransactions,
  resolveBankAccount,
  createPayoutAccount,
  getPayoutAccounts,
  createWithdrawal,
  getWithdrawals,
  getPendingProperties,
  approveProperty,
  rejectProperty,
  getInvestments,
  approveInvestment,
  rejectInvestment,
} = require("../controllers/adminController");

// Protect every admin endpoint.
router.use(adminMiddleware);

// =========================
// PLATFORM WALLET
// =========================

router.get("/wallet", getWallet);

router.get("/wallet/transactions", getWalletTransactions);

// =========================
// PAYOUT ACCOUNTS
// =========================

router.get("/payout/banks/resolve", resolveBankAccount);

router.post("/payout/accounts", createPayoutAccount);

router.get("/payout/accounts", getPayoutAccounts);

// =========================
// WITHDRAWALS
// =========================

router.post("/withdraw", createWithdrawal);

router.get("/withdrawals", getWithdrawals);

// =========================
// PROPERTY VERIFICATION
// =========================

router.get("/properties/pending", getPendingProperties);

router.patch("/properties/:id/approve", approveProperty);

router.patch("/properties/:id/reject", rejectProperty);

// =========================
// INVESTMENT MANAGEMENT
// =========================

router.get("/investments", getInvestments);

router.patch(
  "/investments/:id/approve",
  approveInvestment
);

router.patch(
  "/investments/:id/reject",
  rejectInvestment
);


module.exports = router;
