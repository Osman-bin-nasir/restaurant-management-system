import userModel from "../models/User.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import CustomError from "../utils/customError.js";
import Role from "../models/Role.js";
import bcrypt from 'bcryptjs';

// ➕ Create new user (Admin only)
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, roleName, branchId, shift, employeeId } = req.body;

  // ✅ Validation
  if (!name || !email || !password || !roleName) {
    throw new CustomError("Name, email, password, and roleName are required", 400);
  }

  // ✅ Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new CustomError("Invalid email format", 400);
  }

  // ✅ Password strength validation (minimum 6 chars)
  if (password.length < 6) {
    throw new CustomError("Password must be at least 6 characters long", 400);
  }

  // ✅ Check if user already exists
  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    throw new CustomError("User with this email already exists", 409);
  }

  // ✅ Validate role exists
  const role = await Role.findOne({ name: roleName });
  if (!role) {
    throw new CustomError(`Role '${roleName}' not found. Available roles: admin, manager, cashier, waiter, chef`, 404);
  }

  // ✅ Validate branch if provided
  if (branchId) {
    const Branch = (await import('../models/Branch.js')).default;
    const branchExists = await Branch.findById(branchId);
    if (!branchExists) {
      throw new CustomError("Branch not found", 404);
    }
  }

  // ✅ Validate shift if provided
  const validShifts = ['morning', 'evening', 'night'];
  if (shift && !validShifts.includes(shift)) {
    throw new CustomError("Shift must be one of: morning, evening, night", 400);
  }

  // ✅ Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // ✅ Create user
  const newUser = await userModel.create({
    name,
    email,
    password: hashedPassword,
    role: role._id,
    branchId: branchId || null,
    shift: shift || null,
    employeeId: employeeId || null,
    isActive: true,
    isAccountVerified: false // Requires email verification
  });

  // ✅ Send welcome email
  // await transporter.sendMail({
  //   from: process.env.SENDER_EMAIL,
  //   to: email,
  //   subject: "Welcome to Restaurant Management System",
  //   html: `
  //     <h2>Welcome ${name}!</h2>
  //     <p>Your account has been created with the following details:</p>
  //     <ul>
  //       <li><strong>Email:</strong> ${email}</li>
  //       <li><strong>Role:</strong> ${roleName}</li>
  //       <li><strong>Temporary Password:</strong> ${password}</li>
  //     </ul>
  //     <p><strong>⚠️ Important:</strong> Please change your password after first login.</p>
  //     <p>Login at: <a href="${process.env.FRONTEND_URL}/login">Restaurant Management System</a></p>
  //   `
  // });

  // ✅ Populate role and return
  const populatedUser = await userModel
    .findById(newUser._id)
    .select('-password')
    .populate('role', 'name')
    .populate('branchId', 'name location');

  res.status(201).json({
    success: true,
    message: "User created successfully. Welcome email sent.",
    user: populatedUser
  });
});


// Get all users (Admin only)
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userModel
    .find()
    .select("-password")
    .populate('role', 'name')
    .populate('branchId', 'name location');
  
  res.status(200).json({ success: true, users });
});

// Get single user by ID
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userModel
    .findById(req.params.id)
    .select("-password")
    .populate('role', 'name')
    .populate('branchId', 'name location');
  
  if (!user) throw new CustomError("User not found", 404);
  
  res.status(200).json({ success: true, user });
});

// ✅ NEW: Update own profile (no special permissions needed)
export const updateOwnProfile = asyncHandler(async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;
  
  const user = await userModel.findById(req.user._id);
  if (!user) throw new CustomError("User not found", 404);

  // Update basic info
  if (name) user.name = name;
  if (email) {
    // Check if email is already taken by another user
    const emailExists = await userModel.findOne({ 
      email, 
      _id: { $ne: req.user._id } 
    });
    if (emailExists) throw new CustomError("Email already in use", 400);
    user.email = email;
  }

  // Change password if provided
  if (newPassword) {
    if (!currentPassword) {
      throw new CustomError("Current password is required to set new password", 400);
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new CustomError("Current password is incorrect", 401);
    
    user.password = await bcrypt.hash(newPassword, 10);
  }

  await user.save();
  
  res.status(200).json({ 
    success: true, 
    message: "Profile updated successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
});

// Update user (Admin can update role or user can update self)
export const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, branchId, shift, employeeId, isActive } = req.body;
  const user = await userModel.findById(req.params.id);

  if (!user) throw new CustomError("User not found", 404);

  // Only allow self-update unless admin/manager
  const userRole = await Role.findById(req.user.role);
  const isAdmin = userRole.name === 'admin' || userRole.name === 'manager';
  
  if (!isAdmin && req.user._id.toString() !== req.params.id) {
    throw new CustomError("Unauthorized to update this user", 403);
  }

  // Basic updates
  if (name) user.name = name;
  if (email) {
    const emailExists = await userModel.findOne({ 
      email, 
      _id: { $ne: req.params.id } 
    });
    if (emailExists) throw new CustomError("Email already in use", 400);
    user.email = email;
  }

  // Admin-only updates
  if (isAdmin) {
    if (role) {
      const roleDoc = await Role.findById(role);
      if (!roleDoc) throw new CustomError("Invalid role", 400);
      user.role = role;
    }
    if (branchId !== undefined) user.branchId = branchId;
    if (shift) user.shift = shift;
    if (employeeId) user.employeeId = employeeId;
    if (typeof isActive === 'boolean') user.isActive = isActive;
  }

  await user.save();
  
  const updatedUser = await userModel
    .findById(user._id)
    .select('-password')
    .populate('role', 'name')
    .populate('branchId', 'name location');
  
  res.status(200).json({ 
    success: true, 
    message: "User updated successfully",
    user: updatedUser
  });
});

// Delete user (Admin only)
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.params.id);
  if (!user) throw new CustomError("User not found", 404);

  // Prevent deleting yourself
  if (req.user._id.toString() === req.params.id) {
    throw new CustomError("Cannot delete your own account", 400);
  }

  await user.deleteOne();
  
  res.status(200).json({ 
    success: true, 
    message: "User deleted successfully" 
  });
});

// Assign Role
export const assignRole = asyncHandler(async (req, res) => {
  const { roleName } = req.body;
  const { id: userId } = req.params;

  const user = await userModel.findById(userId);
  if (!user) throw new CustomError('User not found', 404);

  const role = await Role.findOne({ name: roleName });
  if (!role) throw new CustomError('Role not found', 404);

  user.role = role._id;
  await user.save();

  const updatedUser = await userModel
    .findById(userId)
    .select('-password')
    .populate('role', 'name')
    .populate('branchId', 'name location');

  res.status(200).json({
    success: true,
    message: `Role '${roleName}' assigned successfully`,
    user: updatedUser
  });
});