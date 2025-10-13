import {asyncHandler} from "../middleware/asyncHandler.js";
import Role from "../models/Role.js";
import CustomError from "../utils/customError.js";

// ➕ Create Role
export const createRole = asyncHandler(async (req, res) => {
  const { name, permissions } = req.body;

  const roleExists = await Role.findOne({ name });
  if (roleExists) throw new CustomError("Role already exists", 400);

  const role = await Role.create({ name, permissions });
  res.status(201).json({ success: true, message: "Role created successfully", role });
});

// 📋 Get All Roles
export const getAllRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find();
  res.status(200).json({ success: true, roles });
});

// ✏️ Update Role
export const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, permissions } = req.body;

  const role = await Role.findById(id);
  if (!role) throw new CustomError("Role not found", 404);

  if (name) role.name = name;
  if (permissions) role.permissions = permissions;

  await role.save();
  res.status(200).json({ success: true, message: "Role updated successfully", role });
});

// ❌ Delete Role
export const deleteRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const role = await Role.findById(id);

  if (!role) throw new CustomError("Role not found", 404);
  await role.deleteOne();

  res.status(200).json({ success: true, message: "Role deleted successfully" });
});
