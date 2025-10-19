import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateItemStatus, // ✨ NEW
  updateAllItemsStatus, // ✨ NEW
  markOrderAsPaid, // ✨ NEW
  addItemsToOrder,  // ✨ NEW
  cancelOrderItems, // ✨ NEW
  cancelOrder,
  assignCashier,
  getOrderStats
} from "../controllers/orderController.js";
import userAuth from "../middleware/userAuth.js";
import { authorizePermissions } from "../middleware/authorize.js";
import { checkBranchAccess } from "../middleware/branchAccess.js";

const router = express.Router();

// ====================== CORE ORDER ROUTES ======================

router.route("/")
  .get(userAuth, authorizePermissions("orders:view"), checkBranchAccess, getAllOrders)
  .post(userAuth, authorizePermissions("orders:create"), checkBranchAccess, createOrder);

router.route("/:id")
  .get(userAuth, authorizePermissions("orders:view"), getOrderById);

// ====================== ITEM-SPECIFIC ROUTES ======================

// ✨ NEW: Add items to an existing order
router.route("/:orderId/items")
  .post(userAuth, authorizePermissions("orders:update"), addItemsToOrder);

// ✨ NEW: Update status of multiple items in an order
router.route("/:orderId/items/status")
  .patch(userAuth, authorizePermissions("orders:update", "kitchen:update"), updateItemStatus);

// ✨ NEW: Update status of all items in an order (for admins)
router.route("/:orderId/all-items/status")
  .patch(userAuth, authorizePermissions("orders:update"), updateAllItemsStatus);

// ✨ NEW: Mark an order as paid (for admins)
router.route("/:orderId/mark-as-paid")
  .patch(userAuth, authorizePermissions("billing:process"), markOrderAsPaid);

// ✨ NEW: Cancel specific items in an order
router.route("/:orderId/items/cancel")
  .patch(userAuth, authorizePermissions("orders:update"), cancelOrderItems);

// ====================== ORDER-LEVEL STATUS & ASSIGNMENT ======================

// ❌ CANCEL ENTIRE ORDER
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

// ====================== STATS & REPORTS ======================

// 📊 GET ORDER STATS
router.get(
  "/stats/summary",
  userAuth,
  authorizePermissions("reports:view"),
  getOrderStats
);

export default router;