import express from "express";
import {
  createRole,
  getAllRoles,
  updateRole,
  deleteRole
} from "../controllers/roleController.js";
import userAuth from "../middleware/userAuth.js";
import { authorizePermissions } from "../middleware/authorize.js";

const router = express.Router();

// only superadmin or admin can manage roles
router.post("/", userAuth, authorizePermissions("roles:create"), createRole);
router.get("/", userAuth, authorizePermissions("roles:view"), getAllRoles);
router.put("/:id", userAuth, authorizePermissions("roles:update"), updateRole);
router.delete("/:id", userAuth, authorizePermissions("roles:delete"), deleteRole);


export default router;
