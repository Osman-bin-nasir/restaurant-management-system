import express from "express";
import {
  createTable,
  getAllTables,
  getTableById,
  updateTable,
  deleteTable,
  updateTableStatus,
  getAvailableTables,
  mergeTables,
  splitTables,
  reserveTable,
  assignTableToOrder,
  getTableStats,
  clearTable,
} from "../controllers/tableController.js";
import userAuth from "../middleware/userAuth.js";
import { authorizePermissions } from "../middleware/authorize.js";
import { checkBranchAccess } from "../middleware/branchAccess.js";

const router = express.Router();

// 📊 GET TABLE STATS - Dashboard overview
router.get(
  "/stats",
  userAuth,
  authorizePermissions("tables:view"),
  getTableStats
);

// ✅ GET AVAILABLE TABLES - For waiters to find free tables
router.get(
  "/available",
  userAuth,
  authorizePermissions("tables:view"),
  getAvailableTables
);

// 📋 GET ALL TABLES - List all tables
router.get(
  "/",
  userAuth,
  authorizePermissions("tables:view"),
  checkBranchAccess,
  getAllTables
);

// 🔍 GET TABLE BY ID
router.get(
  "/:id",
  userAuth,
  authorizePermissions("tables:view"),
  getTableById
);

// ➕ CREATE TABLE - Admin/Manager only
router.post(
  "/",
  userAuth,
  authorizePermissions("tables:create"),
  checkBranchAccess,
  createTable
);

// ✏️ UPDATE TABLE - Edit table details
router.put(
  "/:id",
  userAuth,
  authorizePermissions("tables:update"),
  updateTable
);

// 🗑️ DELETE TABLE - Admin/Manager only
router.delete(
  "/:id",
  userAuth,
  authorizePermissions("tables:update"),
  deleteTable
);

// 🔄 UPDATE TABLE STATUS - Change availability
router.patch(
  "/:id/status",
  userAuth,
  authorizePermissions("tables:update"),
  updateTableStatus
);

// 🔗 MERGE TABLES - Combine tables for large groups
router.post(
  "/merge",
  userAuth,
  authorizePermissions("tables:manage"),
  mergeTables
);

// ✂️ SPLIT TABLES - Separate merged tables
router.post(
  "/split",
  userAuth,
  authorizePermissions("tables:manage"),
  splitTables
);

// 📅 RESERVE TABLE - Reserve for customer
router.post(
  "/reserve",
  userAuth,
  authorizePermissions("tables:update"),
  reserveTable
);

// 🎯 ASSIGN TABLE TO ORDER - Link table with order
router.post(
  "/assign-order",
  userAuth,
  authorizePermissions("tables:update"),
  assignTableToOrder
);

// 🧹 CLEAR TABLE - Make available after payment
router.post(
  "/:id/clear",
  userAuth,
  authorizePermissions("tables:update"),
  clearTable
);

export default router;