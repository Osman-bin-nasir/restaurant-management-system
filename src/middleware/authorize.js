import {asyncHandler} from "./asyncHandler.js";
import Role from "../models/Role.js";
import CustomError from "../utils/customError.js";

// 🧠 Permission-based access control
export const authorizePermissions = (...requiredPermissions) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new CustomError("Not authenticated", 401);
    }

    // Fetch user role (populate if not already)
    const role = await Role.findById(req.user.role);

    if (!role) {
      throw new CustomError("Role not found", 404);
    }

    // Check if user role includes at least one required permission
    const hasPermission = requiredPermissions.every(p =>
      role.permissions.includes(p)
    );

    if (!hasPermission) {
      throw new CustomError("Access denied: insufficient permissions", 403);
    }

    next();
  });
};
