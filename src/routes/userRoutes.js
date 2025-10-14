import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  assignRole
} from "../controllers/userController.js";
import userAuth from "../middleware/userAuth.js";
import { authorizePermissions } from "../middleware/authorize.js";

const router = express.Router();

// Only admins/managers with permission can assign roles
router.put(
  "/assign-role/:id",
  userAuth,
  authorizePermissions("users:update"),
  assignRole
);

// 👑 Permission-based routes
router.get("/", userAuth, authorizePermissions("users:view"), getAllUsers);
router.get("/:id", userAuth, authorizePermissions("users:view"), getUserById);
router.put("/:id", userAuth, authorizePermissions("users:update"), updateUser);
router.delete("/:id", userAuth, authorizePermissions("users:delete"), deleteUser);


export default router;
