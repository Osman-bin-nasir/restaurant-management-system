import express from "express";
import userAuth from "../middleware/userAuth.js";
import { authorizePermissions } from "../middleware/authorize.js";
import { createPermission, getAllPermissions, deletePermission } from "../controllers/permissionController.js";

const router = express.Router();

router.post("/", userAuth, authorizePermissions("roles:create"), createPermission);
router.get("/", userAuth, authorizePermissions("roles:view"), getAllPermissions);
router.delete("/:id", userAuth, authorizePermissions("roles:delete"), deletePermission);

export default router;