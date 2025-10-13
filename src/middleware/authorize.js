import CustomError from "../utils/customError.js";

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      throw new CustomError("User not authenticated", 401);
    }

    // Compare role.name instead of ObjectId
    if (!allowedRoles.includes(req.user.role.name)) {
      throw new CustomError("Access denied: insufficient permissions", 403);
    }

    next();
  };
};
