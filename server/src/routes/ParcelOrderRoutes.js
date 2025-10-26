import express from "express";
import {
  createParcelOrder,
  getAllParcelOrders,
  getParcelOrderById,
  startPreparingItems,
  markItemsReady,
  markOrderCompleted,
  getParcelKitchenQueue,
  refundParcelOrder,
  getParcelOrderStats
} from "../controllers/ParcelOrderController.js";
import userAuth from "../middleware/userAuth.js";
import { authorizePermissions } from "../middleware/authorize.js";

const router = express.Router();

// ✅ CASHIER: Create & Bill Parcel Order
router.post(
  "/",
  userAuth,
  authorizePermissions("billing:process"),
  createParcelOrder
);

// ✅ GET ALL PARCEL ORDERS
router.get(
  "/",
  userAuth,
  authorizePermissions("orders:view"),
  getAllParcelOrders
);

// ✅ GET ORDER BY ID
router.get(
  "/:id",
  userAuth,
  authorizePermissions("orders:view"),
  getParcelOrderById
);

// 👨‍🍳 KITCHEN: Start Preparing Items
router.patch(
  "/:orderId/items/start",
  userAuth,
  authorizePermissions("kitchen:update"),
  startPreparingItems
);

// 👨‍🍳 KITCHEN: Mark Items Ready
router.patch(
  "/:orderId/items/ready",
  userAuth,
  authorizePermissions("kitchen:update"),
  markItemsReady
);

// ✅ CASHIER: Mark Completed (Handed Over)
router.patch(
  "/:orderId/complete",
  userAuth,
  authorizePermissions("billing:process"),
  markOrderCompleted
);

// 👨‍🍳 KITCHEN: Get Parcel Queue
router.get(
  "/queue/kitchen",
  userAuth,
  authorizePermissions("kitchen:view"),
  getParcelKitchenQueue
);

// 💰 CASHIER: Refund Order
router.post(
  "/:orderId/refund",
  userAuth,
  authorizePermissions("billing:process"),
  refundParcelOrder
);

router.get(
  "/stats",
  userAuth,
  authorizePermissions("orders:view"),
  getParcelOrderStats
);

export default router;