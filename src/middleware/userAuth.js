import jwt from "jsonwebtoken";
import userModel from "../models/User.js";
import CustomError from "../utils/customError.js";

const userAuth = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new CustomError("Not Logged In", 401));
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Populate role
    const user = await userModel
      .findById(decodedToken.id)
      .select("-password")
      .populate("role", "name permissions"); // populate name & permissions

    if (!user) {
      return next(new CustomError("User not found", 404));
    }

    req.user = user; // user.role is now populated
    next();
  } catch (error) {
    next(new CustomError(error.message, 401));
  }
};

export default userAuth;
