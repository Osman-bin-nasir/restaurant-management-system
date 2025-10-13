import jwt from "jsonwebtoken";
import userModel from "../models/User.js";

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      const error = new Error("Not Logged In");
      error.statusCode = 401; // Unauthorized
      return next(error);
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decodedToken.id).select("-password");

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    req.user = user;
    next();

  } catch (error) {
    // If JWT verification fails, handle it gracefully
    if (error.name === "JsonWebTokenError") {
      error.message = "Invalid or expired token";
      error.statusCode = 401;
    }
    next(error); // Pass to centralized error handler
  }
};

export default userAuth;
