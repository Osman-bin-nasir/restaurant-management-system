import CustomError from '../utils/customError.js';

// 🧠 Permission-based access control
export const authorizePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user || !Array.isArray(req.user.permissions)) {
      return next(new CustomError('Not authenticated', 401));
    }

    const hasPermission = requiredPermissions.some(p =>
      req.user.permissions.includes(p)
    );

    if (!hasPermission) {
      return next(new CustomError('Access denied: insufficient permissions', 403));
    }

    next();
  };
};
