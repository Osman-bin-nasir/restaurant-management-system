import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/User.js';
import Role from '../models/Role.js';
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import CustomError from '../utils/customError.js';

// ====================== REGISTER ======================
// export const register = asyncHandler(async (req, res) => {
//     const { name, email, password, roleName = 'waiter' } = req.body; // Allow optional role

//     if (!name || !email || !password) {
//         throw new CustomError("Missing details!!", 400);
//     }

//     const existingUser = await userModel.findOne({ email });
//     if (existingUser) throw new CustomError("User already exists", 409);

//     // Get the role (default to 'waiter' if not specified)
//     const role = await Role.findOne({ name: roleName });
//     if (!role) throw new CustomError("Role not found", 404);

//     const hashedPassword = await bcrypt.hash(password, 9);

//     const User = await userModel.create({
//         name,
//         email,
//         password: hashedPassword,
//         role: role._id, // ✅ Assign role
//     });

//     const token = jwt.sign({ id: User._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

//     res.cookie('token', token, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
//         maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     await transporter.sendMail({
//         from: process.env.SENDER_EMAIL,
//         to: email,
//         subject: "Welcome to Restaurant Management System",
//         text: `Welcome ${name}, your account has been created with email ${email}.`,
//     });

//     res.json({ success: true, message: "Registered successfully" });
// });

// ====================== REGISTER ======================
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, roleName = 'waiter' } = req.body;

  // ✅ Validation
  if (!name || !email || !password) {
    throw new CustomError("Name, email, and password are required", 400);
  }

  // ✅ Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new CustomError("Invalid email format", 400);
  }

  // ✅ Password strength validation
  if (password.length < 6) {
    throw new CustomError("Password must be at least 6 characters long", 400);
  }

  // ✅ Check if user already exists
  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    throw new CustomError("User with this email already exists", 409);
  }

  // ✅ Get role (default to 'waiter' if not specified)
  const role = await Role.findOne({ name: roleName });
  if (!role) {
    throw new CustomError("Role not found", 404);
  }

  // ✅ Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // ✅ Create user
  const newUser = await userModel.create({
    name,
    email,
    password: hashedPassword,
    role: role._id,
    isAccountVerified: false
  });

  // ✅ Create JWT token
  const token = jwt.sign(
    { id: newUser._id },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  // ✅ Set cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // ✅ Send welcome email
  await transporter.sendMail({
    from: process.env.SENDER_EMAIL,
    to: email,
    subject: "Welcome to Restaurant Management System",
    html: `
      <h2>Welcome ${name}!</h2>
      <p>Your account has been created successfully.</p>
      <p>Please verify your email to complete the setup.</p>
    `
  });

  res.status(201).json({
    success: true,
    message: "Registered successfully. Please verify your email.",
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: roleName
    }
  });
});

// ====================== LOGIN ======================
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) throw new CustomError("Missing email or password", 400);
  
    const User = await userModel.findOne({ email }).populate({
        path: 'role',
        populate: {
            path: 'permissions',
            select: 'name'
        }
    });
    if (!User) throw new CustomError("Invalid email or password", 401);
  
    const isMatch = await bcrypt.compare(password, User.password);
    if (!isMatch) throw new CustomError("Invalid email or password", 401);
  
    // Sign JWT with role and permissions
    const token = jwt.sign(
      {
        id: User._id,
        role: User.role.name,
        permissions: User.role.permissions.map(p => p.name),
        branchId: User.branchId,
        shift: User.shift,
        isAccountVerified: User.isAccountVerified
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  
    res.json({ success: true, message: "Login successful" });
  });
  


// ====================== LOGOUT ======================
export const logout = asyncHandler(async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });

    res.json({ success: true, message: "Logged out successfully" });
});


// ====================== SEND VERIFY OTP ======================
export const sendVerifyOtp = asyncHandler(async (req, res) => {
    const { userId } = req;
    if (!userId) throw new CustomError("Unauthorized", 401);

    const User = await userModel.findById(userId);
    if (!User) throw new CustomError("User not found", 404);

    if (User.isAccountVerified) throw new CustomError("Account already verified", 400);

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    User.verifyOtp = otp;
    User.verifyOtpExpireAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
    await User.save();

    await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: User.email,
        subject: "OTP to verify your account",
        html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", User.email),
    });

    res.json({ success: true, message: "OTP sent to email" });
});


// ====================== VERIFY EMAIL ======================
export const verifyEmail = asyncHandler(async (req, res) => {
    const { userId } = req;
    const { otp } = req.body;

    if (!userId || !otp) throw new CustomError("Missing details", 400);

    const User = await userModel.findById(userId);
    if (!User) throw new CustomError("User not found", 404);

    if (User.verifyOtp !== otp) throw new CustomError("Invalid OTP", 400);
    if (User.verifyOtpExpireAt < Date.now()) throw new CustomError("OTP expired", 400);

    User.isAccountVerified = true;
    User.verifyOtp = '';
    User.verifyOtpExpireAt = 0;
    await User.save();

    res.json({ success: true, message: "Email verified successfully" });
});


// ====================== CHECK AUTH ======================
export const isAuthenticated = asyncHandler(async (req, res) => {
    if (!req.user) throw new CustomError("Not logged in", 401);

    // ✅ Populate role with permissions for frontend
    const user = await userModel
        .findById(req.user.id)
        .select('-password')
        .populate({
            path: 'role',
            populate: {
                path: 'permissions',
                select: 'name description'
            }
        });

    if (!user) throw new CustomError("User not found", 404);

    res.json({
        success: true,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role.name,
            permissions: user.role.permissions.map(p => p.name),
            branchId: user.branchId,
            employeeId: user.employeeId,
            shift: user.shift,
            isAccountVerified: user.isAccountVerified,
            token: req.cookies.token
        },
    });
});


// ====================== SEND RESET OTP ======================
export const sendResetOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new CustomError("Please provide email", 400);

    const User = await userModel.findOne({ email });
    if (!User) throw new CustomError("User not found", 404);

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    User.resetOtp = otp;
    User.resetOtpExpireAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    await User.save();

    await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: User.email,
        subject: "OTP to reset your password",
        html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", User.email),
    });

    res.json({ success: true, message: "Password reset OTP sent to email" });
});


// ====================== VERIFY RESET OTP ======================
export const verifyResetOtp = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) throw new CustomError("Missing details", 400);

    const User = await userModel.findOne({ email });
    if (!User) throw new CustomError("User not found", 404);

    if (User.resetOtp !== otp) throw new CustomError("Invalid OTP", 400);
    if (User.resetOtpExpireAt < Date.now()) throw new CustomError("OTP expired", 400);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    User.password = hashedPassword;
    User.resetOtp = '';
    User.resetOtpExpireAt = 0;
    await User.save();

    res.json({ success: true, message: "Password reset successful" });
});