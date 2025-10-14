import {asyncHandler} from "../middleware/asyncHandler.js";
import Role from "../models/Role.js";
import Permission from "../models/Permissions.js";
import CustomError from "../utils/customError.js";

// ➕ Create Role
export const createRole = asyncHandler(async (req, res) => {
  const { name, permissions } = req.body;

  if (!name || !permissions || permissions.length === 0) {
    throw new CustomError("Name and permissions are required", 400);
  }

  const roleExists = await Role.findOne({ name });
  if (roleExists) throw new CustomError("Role already exists", 400);

  // ✅ Validate that all permissions exist
  const validPermissions = await Permission.find({ _id: { $in: permissions } });
  if (validPermissions.length !== permissions.length) {
    throw new CustomError("One or more invalid permissions provided", 400);
  }

  const role = await Role.create({ name, permissions });
  
  // Populate permissions in response
  const populatedRole = await Role.findById(role._id).populate('permissions', 'name description');
  
  res.status(201).json({ 
    success: true, 
    message: "Role created successfully", 
    role: populatedRole 
  });
});

// 📋 Get All Roles
export const getAllRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().populate('permissions', 'name description');
  res.status(200).json({ success: true, roles });
});

// 🔍 Get Single Role
export const getRoleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const role = await Role.findById(id).populate('permissions', 'name description');
  if (!role) throw new CustomError("Role not found", 404);
  
  res.status(200).json({ success: true, role });
});

// ✏️ Update Role
export const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, permissions } = req.body;

  const role = await Role.findById(id);
  if (!role) throw new CustomError("Role not found", 404);

  // Prevent modifying system roles
  if (['admin', 'manager', 'cashier', 'waiter', 'chef'].includes(role.name) && name && name !== role.name) {
    throw new CustomError("Cannot rename system default roles", 403);
  }

  // Validate permissions if provided
  if (permissions) {
    const validPermissions = await Permission.find({ _id: { $in: permissions } });
    if (validPermissions.length !== permissions.length) {
      throw new CustomError("One or more invalid permissions provided", 400);
    }
    role.permissions = permissions;
  }

  if (name) role.name = name;

  await role.save();
  
  // Populate before sending response
  const updatedRole = await Role.findById(id).populate('permissions', 'name description');
  
  res.status(200).json({ 
    success: true, 
    message: "Role updated successfully", 
    role: updatedRole 
  });
});

// ❌ Delete Role
export const deleteRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const role = await Role.findById(id);

  if (!role) throw new CustomError("Role not found", 404);
  
  // Prevent deleting system roles
  if (['admin', 'manager', 'cashier', 'waiter', 'chef'].includes(role.name)) {
    throw new CustomError("Cannot delete system default roles", 403);
  }
  
  // Check if any users have this role
  const User = (await import('../models/User.js')).default;
  const usersWithRole = await User.countDocuments({ role: id });
  
  if (usersWithRole > 0) {
    throw new CustomError(`Cannot delete role. ${usersWithRole} user(s) are assigned to this role`, 400);
  }

  await role.deleteOne();

  res.status(200).json({ success: true, message: "Role deleted successfully" });
});