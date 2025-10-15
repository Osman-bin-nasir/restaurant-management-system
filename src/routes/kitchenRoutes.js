import express from "express";
import {
  getKitchenOrders,
  startPreparingOrder,
  markOrderReady,
  getKitchenStats,
  updateItemAvailability
} from "../controllers/kitchenController.js";
import userAuth from "../middleware/userAuth.js";
import { authorizePermissions } from "../middleware/authorize.js";

const router = express.Router();

// 📋 GET KITCHEN ORDERS - View pending orders
router.get(
  "/orders",
  userAuth,
  authorizePermissions("kitchen:view"),
  getKitchenOrders
);

// 👨‍🍳 START PREPARING - Mark order as in-kitchen
router.patch(
  "/orders/:orderId/start",
  userAuth,
  authorizePermissions("kitchen:update"),
  startPreparingOrder
);

// ✅ MARK AS READY - Order is ready for serving
router.patch(
  "/orders/:orderId/ready",
  userAuth,
  authorizePermissions("kitchen:update"),
  markOrderReady
);

// 📊 KITCHEN STATS - Dashboard metrics
router.get(
  "/stats",
  userAuth,
  authorizePermissions("kitchen:view"),
  getKitchenStats
);

// 🔧 UPDATE AVAILABILITY - Mark items as out of stock
router.patch(
  "/items/availability",
  userAuth,
  authorizePermissions("kitchen:update"),
  updateItemAvailability
);

export default router;