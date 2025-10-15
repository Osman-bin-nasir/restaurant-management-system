import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  cancelOrder,
  assignCashier,
  getOrderStats
} from "../controllers/orderController.js";
import userAuth from "../middleware/userAuth.js";
import { authorizePermissions } from "../middleware/authorize.js";
import { checkBranchAccess } from "../middleware/branchAccess.js";

const router = express.Router();

// 📋 GET ALL ORDERS - Waiters, Managers, Admins
router.get(
  "/",
  userAuth,
  authorizePermissions("orders:view"),
  checkBranchAccess,
  getAllOrders
);

// 📊 GET ORDER STATS - Managers & Admins only
router.get(
  "/stats/summary",
  userAuth,
  authorizePermissions("reports:view"),
  getOrderStats
);

// 📌 GET ORDER BY ID
router.get(
  "/:id",
  userAuth,
  authorizePermissions("orders:view"),
  getOrderById
);

// ➕ CREATE ORDER - Waiters, Managers, Admins
router.post(
  "/",
  userAuth,
  authorizePermissions("orders:create"),
  checkBranchAccess,
  createOrder
);

// ✏️ UPDATE ORDER (Edit items, customer name) - Only in "placed" status
router.put(
  "/:id",
  userAuth,
  authorizePermissions("orders:update"),
  updateOrder
);

// 🔄 UPDATE ORDER STATUS - Kitchen, Cashier, Waiter, Manager
router.patch(
  "/:id/status",
  userAuth,
  authorizePermissions("orders:update"),
  updateOrderStatus
);

// ❌ CANCEL ORDER - Waiter, Manager, Admin
router.patch(
  "/:id/cancel",
  userAuth,
  authorizePermissions("orders:delete"),
  cancelOrder
);

// 💳 ASSIGN CASHIER TO ORDER
router.patch(
  "/:id/assign-cashier",
  userAuth,
  authorizePermissions("orders:update"),
  assignCashier
);

export default router;