import { asyncHandler } from "./asyncHandler.js";
import Role from "../models/Role.js";
import CustomError from "../utils/customError.js";

/**
 * Middleware to check if user has access to specific branch
 * Admins can access all branches
 * Other users can only access their assigned branch
 */
export const checkBranchAccess = asyncHandler(async (req, res, next) => {
  // Get branchId from params, body, or query
  const branchId = req.params.branchId || req.body.branchId || req.query.branchId;
  
  if (!branchId) {
    // If no branchId in request, use user's assigned branch
    if (!req.user.branchId) {
      throw new CustomError("No branch assigned to user", 403);
    }
    // Set branchId for controllers to use
    req.branchId = req.user.branchId;
    return next();
  }
  
  // Fetch role to check if admin
  const role = await Role.findById(req.user.role);
  
  // Admins and managers can access all branches
  if (role && (role.name === 'admin' || role.name === 'manager')) {
    req.branchId = branchId;
    return next();
  }
  
  // Other users must match their assigned branch
  if (!req.user.branchId || req.user.branchId.toString() !== branchId.toString()) {
    throw new CustomError("Access denied: You don't have access to this branch", 403);
  }
  
  req.branchId = branchId;
  next();
});

/**
 * Middleware to ensure user has a branch assigned
 * Used for operations that require branch context
 */
export const requireBranch = asyncHandler(async (req, res, next) => {
  if (!req.user.branchId) {
    throw new CustomError("No branch assigned. Please contact admin.", 403);
  }
  
  req.branchId = req.user.branchId;
  next();
});