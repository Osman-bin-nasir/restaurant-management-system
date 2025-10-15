import express from "express";
import {
  getDailyRevenue,
  getMonthlyRevenue,
  getYearlyRevenue,
  getRevenueComparison,
  getRevenueTrends
} from "../controllers/revenueController.js";
import userAuth from "../middleware/userAuth.js";
import { authorizePermissions } from "../middleware/authorize.js";
import { requireBranch } from "../middleware/branchAccess.js";

const router = express.Router();

// 📊 GET DAILY REVENUE - Today's or specific date
router.get(
  "/daily",
  userAuth,
  authorizePermissions("reports:view"),
  requireBranch,
  getDailyRevenue
);

// 📈 GET MONTHLY REVENUE - Current or specific month
router.get(
  "/monthly",
  userAuth,
  authorizePermissions("reports:view"),
  requireBranch,
  getMonthlyRevenue
);

// 📆 GET YEARLY REVENUE - Current or specific year
router.get(
  "/yearly",
  userAuth,
  authorizePermissions("reports:view"),
  requireBranch,
  getYearlyRevenue
);

// 🔄 GET REVENUE COMPARISON - Compare periods
router.get(
  "/comparison",
  userAuth,
  authorizePermissions("reports:view"),
  requireBranch,
  getRevenueComparison
);

// 📉 GET REVENUE TRENDS - Last N days trend
router.get(
  "/trends",
  userAuth,
  authorizePermissions("reports:view"),
  requireBranch,
  getRevenueTrends
);

export default router;