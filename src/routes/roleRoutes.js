import express from "express";
import {
  createRole,
  getAllRoles,
  updateRole,
  deleteRole
} from "../controllers/roleController.js";
import userAuth from "../middleware/userAuth.js";
import { authorizeRoles } from "../middleware/authorize.js";

const router = express.Router();

// only superadmin or admin can manage roles
router.post("/", userAuth, authorizeRoles("superadmin", "admin"), createRole);
router.get("/", userAuth, authorizeRoles("superadmin", "admin"), getAllRoles);
router.put("/:id", userAuth, authorizeRoles("superadmin", "admin"), updateRole);
router.delete("/:id", userAuth, authorizeRoles("superadmin", "admin"), deleteRole);

export default router;
