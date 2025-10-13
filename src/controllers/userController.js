import userModel from "../models/User.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import CustomError from "../utils/customError.js";

// Get all users (Admin only)
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userModel.find().select("-password");
  res.status(200).json({ success: true, users });
});

// Get single user by ID
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.params.id).select("-password");
  if (!user) throw new CustomError("User not found", 404);
  res.status(200).json({ success: true, user });
});

// Update user (Admin can update role or user can update self)
export const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role } = req.body;
  const user = await userModel.findById(req.params.id);

  if (!user) throw new CustomError("User not found", 404);

  // Only allow self-update unless admin
  if (req.user.role !== "admin" && req.user._id.toString() !== req.params.id) {
    throw new CustomError("Unauthorized to update this user", 403);
  }

  user.name = name || user.name;
  user.email = email || user.email;
  if (role && req.user.role === "admin") user.role = role;

  await user.save();
  res.status(200).json({ success: true, message: "User updated successfully" });
});

// Delete user (Admin only)
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.params.id);
  if (!user) throw new CustomError("User not found", 404);

  res.status(200).json({ success: true, message: "User deleted successfully", user });
  await user.deleteOne();
});
