import asyncHandler from './asyncHandler.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import CustomError from '../utils/customError.js';

export const roleMiddleware = (...allowedRoles) =>
    asyncHandler(async (req, res, next) => {
        const user = req.user;
        if (!user) throw new CustomError('Not authenticated', 401);

        // If user.role is an ObjectId, fetch Role document
        let roleName = user.role;
        if (typeof roleName !== 'string') {
            const roleDoc = await Role.findById(user.role);
            if (!roleDoc) throw new CustomError('Role not found', 404);
            roleName = roleDoc.name;
        }

        if (!allowedRoles.includes(roleName)) {
            throw new CustomError('Access denied', 403);
        }

        next();
    });
