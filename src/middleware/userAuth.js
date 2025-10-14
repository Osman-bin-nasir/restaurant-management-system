import jwt from "jsonwebtoken";
import CustomError from "../utils/customError.js";
import User from "../models/User.js";

const userAuth = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) return next(new CustomError("Not logged in", 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select("-password")
      .populate({
        path: "role",
        select: "name permissions",
        populate: { path: "permissions", select: "name" },
      })
      .populate("branchId", "name location");

    if (!user) return next(new CustomError("User not found", 404));

    // Attach full doc
    req.userDoc = user;

    // Attach flat object for permission checks
    req.user = {
      id: user._id,
      role: user.role?.name,
      permissions: user.role?.permissions?.map((p) => p.name) || [],
      branchId: user.branchId?._id,
      shift: user.shift,
      isAccountVerified: user.isAccountVerified,
    };

    next();
  } catch (err) {
    return next(new CustomError("Invalid or expired token", 401));
  }
};

export default userAuth;
