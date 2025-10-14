import express from "express";
import {
  processPayment,
  generateBill,
  applyDiscount,
  getPendingBills,
  getDailySummary,
  refundOrder,
  splitBill,
  getCashierStats,
  voidTransaction
} from "../controllers/cashierController.js";
import userAuth from "../middleware/userAuth.js";
import { authorizePermissions } from "../middleware/authorize.js";

const router = express.Router();

// 💳 PROCESS PAYMENT - Mark order as paid
router.post(
  "/payment/process",
  userAuth,
  authorizePermissions("billing:process"),
  processPayment
);

// 📄 GENERATE BILL - Get printable bill
router.get(
  "/bill/:orderId",
  userAuth,
  authorizePermissions("billing:view"),
  generateBill
);

// 💰 APPLY DISCOUNT - Add discount to order
router.patch(
  "/discount/:orderId",
  userAuth,
  authorizePermissions("billing:discount"),
  applyDiscount
);

// 📋 GET PENDING BILLS - Orders ready for payment
router.get(
  "/pending-bills",
  userAuth,
  authorizePermissions("billing:view"),
  getPendingBills
);

// 📊 GET DAILY SUMMARY - Daily sales report
router.get(
  "/summary/daily",
  userAuth,
  authorizePermissions("reports:view"),
  getDailySummary
);

// 💵 REFUND ORDER - Process refund
router.post(
  "/refund/:orderId",
  userAuth,
  authorizePermissions("billing:process"),
  refundOrder
);

// 🔀 SPLIT BILL - Split payment between customers
router.post(
  "/split-bill",
  userAuth,
  authorizePermissions("billing:process"),
  splitBill
);

// 📈 GET CASHIER STATS - Personal stats
router.get(
  "/stats/today",
  userAuth,
  authorizePermissions("billing:view"),
  getCashierStats
);

// ❌ VOID TRANSACTION - Cancel paid order
router.post(
  "/void/:orderId",
  userAuth,
  authorizePermissions("billing:process"),
  voidTransaction
);

export default router;