import express from "express";
import {
  createMenuItem,
  getAllMenuItems,
  getMenuById,
  updateMenuItem,
  deleteMenuItem
} from "../controllers/menuController.js";

import userAuth from "../middleware/userAuth.js";
import { authorizePermissions } from "../middleware/authorize.js";

const router = express.Router();

// Public or customer routes
router.get("/", getAllMenuItems);
router.get("/:id", getMenuById);

// Protected admin/staff routes
router.post("/", userAuth, authorizePermissions("menu:create"), createMenuItem);
router.put("/:id", userAuth, authorizePermissions("menu:update"), updateMenuItem);
router.delete("/:id", userAuth, authorizePermissions("menu:delete"), deleteMenuItem);

export default router;