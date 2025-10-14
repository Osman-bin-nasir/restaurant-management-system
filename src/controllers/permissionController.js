import Permission from "../models/Permissions.js";
import CustomError from "../utils/customError.js";
import {asyncHandler} from "../middleware/asyncHandler.js";

// ➕ Add a new permission
export const createPermission = asyncHandler(async (req, res) => {
  const { key, description } = req.body;
  if (!key || !description) throw new CustomError("Missing fields", 400);

  const existing = await Permission.findOne({ key });
  if (existing) throw new CustomError("Permission already exists", 400);

  const permission = await Permission.create({ key, description });
  res.status(201).json({ success: true, permission });
});

// 📋 Get all permissions
export const getAllPermissions = asyncHandler(async (req, res) => {
  const permissions = await Permission.find();
  res.status(200).json({ success: true, permissions });
});

// 🗑️ Delete permission
export const deletePermission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const permission = await Permission.findById(id);
  if (!permission) throw new CustomError("Permission not found", 404);

  await permission.deleteOne();
  res.status(200).json({ success: true, message: "Permission deleted" });
});
