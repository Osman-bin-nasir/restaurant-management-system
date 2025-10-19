import express from "express";
import {
  getKitchenQueue,
  startCookingItems,
  markItemsReady,
  getKitchenStats,
  updateItemAvailability
} from "../controllers/kitchenController.js";
import userAuth from "../middleware/userAuth.js";
import { authorizePermissions } from "../middleware/authorize.js";

const router = express.Router();

// 📋 GET KITCHEN QUEUE - View pending items
router.get(
  "/queue",
  userAuth,
  authorizePermissions("kitchen:view"),
  getKitchenQueue
);

// 👨‍🍳 START COOKING ITEMS - Mark items as in-kitchen
router.post(
  "/items/start-cooking",
  userAuth,
  authorizePermissions("kitchen:update"),
  startCookingItems
);

// ✅ MARK ITEMS READY - Items are ready for serving
router.post(
  "/items/mark-ready",
  userAuth,
  authorizePermissions("kitchen:update"),
  markItemsReady
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