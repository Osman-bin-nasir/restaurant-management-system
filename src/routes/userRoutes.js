import express from "express";
import { getAllUsers, getUserById, updateUser, deleteUser } from "../controllers/userController.js";
import userAuth from "../middleware/userAuth.js";
import { authorizeRoles } from "../middleware/authorize.js";

const router = express.Router();

// 👑 Admin routes
router.get("/", userAuth, authorizeRoles("admin"), getAllUsers);
router.get("/:id", userAuth, getUserById);
router.put("/:id", userAuth, updateUser);
router.delete("/:id", userAuth, authorizeRoles("admin"), deleteUser);

export default router;