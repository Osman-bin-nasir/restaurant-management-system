import Role from "../models/Role.js";
import Permission from "../models/Permissions.js";

/**
 * Check if a user has specific permissions
 * @param {Object} user - User object with role populated
 * @param {Array<string>} requiredPermissions - Array of permission names
 * @returns {boolean}
 */
export const hasPermissions = async (user, requiredPermissions) => {
  if (!user || !user.role) return false;

  const role = await Role.findById(user.role).populate('permissions');
  if (!role) return false;

  const userPermissions = role.permissions.map(p => p.name);

  // Check for admin wildcard
  if (userPermissions.includes('*')) return true;

  // Check each required permission
  return requiredPermissions.every(required => {
    // Exact match
    if (userPermissions.includes(required)) return true;

    // Wildcard match (e.g., 'orders:*' matches 'orders:create')
    const [resource] = required.split(':');
    if (userPermissions.includes(`${resource}:*`)) return true;

    return false;
  });
};

/**
 * Check if a user has a specific role
 * @param {Object} user - User object with role populated
 * @param {Array<string>} allowedRoles - Array of role names
 * @returns {boolean}
 */
export const hasRole = async (user, allowedRoles) => {
  if (!user || !user.role) return false;

  let roleName = user.role;
  
  // If role is populated object
  if (typeof user.role === 'object' && user.role.name) {
    roleName = user.role.name;
  } else if (typeof user.role !== 'string') {
    // If it's an ObjectId, fetch the role
    const role = await Role.findById(user.role);
    if (!role) return false;
    roleName = role.name;
  }

  return allowedRoles.includes(roleName);
};

/**
 * Get all permissions for a role
 * @param {string} roleId - Role ID
 * @returns {Array<string>} - Array of permission names
 */
export const getRolePermissions = async (roleId) => {
  const role = await Role.findById(roleId).populate('permissions');
  if (!role) return [];
  
  return role.permissions.map(p => p.name);
};

/**
 * Check if user can access a specific branch
 * @param {Object} user - User object
 * @param {string} branchId - Branch ID to check
 * @returns {boolean}
 */
export const canAccessBranch = async (user, branchId) => {
  if (!user) return false;

  // Check if user has admin/manager role
  const isAdmin = await hasRole(user, ['admin', 'manager']);
  if (isAdmin) return true;

  // Check if user is assigned to this branch
  return user.branchId && user.branchId.toString() === branchId.toString();
};

/**
 * Get all available permissions
 * @returns {Array<Object>} - Array of permission objects
 */
export const getAllPermissions = async () => {
  return await Permission.find().select('name description');
};

/**
 * Validate if permissions exist
 * @param {Array<string>} permissionIds - Array of permission IDs
 * @returns {boolean}
 */
export const validatePermissions = async (permissionIds) => {
  const validPermissions = await Permission.find({ _id: { $in: permissionIds } });
  return validPermissions.length === permissionIds.length;
};