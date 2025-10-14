import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  assignRole,
  updateOwnProfile,
  createUser
} from "../controllers/userController.js";
import userAuth from "../middleware/userAuth.js";
import { authorizePermissions } from "../middleware/authorize.js";

const router = express.Router();

router.post(
  "/",
  userAuth,
  authorizePermissions("users:create"),
  createUser
);

// ✅ Self-service routes (no special permissions needed)
router.get("/me", userAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

router.put("/profile", userAuth, updateOwnProfile);

// 👑 Permission-based routes
router.get("/", userAuth, authorizePermissions("users:view"), getAllUsers);
router.get("/:id", userAuth, authorizePermissions("users:view"), getUserById);
router.put("/:id", userAuth, authorizePermissions("users:update"), updateUser);
router.delete("/:id", userAuth, authorizePermissions("users:delete"), deleteUser);

// Only admins/managers can assign roles
router.put(
  "/assign-role/:id",
  userAuth,
  authorizePermissions("users:update"),
  assignRole
);

export default router;