import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import userModel from '../models/User.js';
import transporter from '../config/nodemailer.js';

import {EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE} from '../config/emailTemplates.js';

export const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.json({ success: false, message: "Missing details" })
    }

    try {

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 9);

        const User = new userModel({
            name,
            email,
            password: hashedPassword
        })

        await User.save();

        const token = jwt.sign(
            { id: User._id },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d'
            });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
                'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        // Sending welcome email

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Welcome to Learning Authentication",
            text: `Weolcome ${name}.
             Happy Learning Authentication.
             Your account has been created with email ${email}`
        }

        await transporter.sendMail(mailOptions);

        return res.json({ success: true })
    }
    catch (err) { 
        res.json({ success: false, message: err.message })
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.json({ success: false, message: "Missing email or password" });
    }

    try {
        const User = await userModel.findOne({ email });

        if (!User) {
            return res.json({ success: false, message: "Email or password is invalid" });
        }

        const isMatch = await bcrypt.compare(password, User.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Email or password is invalid" });
        }

        const token = jwt.sign(
            { id: User._id },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d'
            });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
                'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.json({ success: true })

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }

}

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
                'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        res.json({ success: false, message: "Failed to logout" });
    }
}

// Sending verification otp to users email

export const sendVerifyOtp = async (req, res) => {
    try {
        const { userId } = req;

        const User = await userModel.findById(userId);

        if (User.isAccountVerified) {
            return res.json({ success: false, message: "Account already verified" })
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000))

        User.verifyOtp = otp;

        User.verifyOtpExpireAt = Date.now() + 1 * 60 * 60 * 1000

        await User.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: User.email,
            subject: "OTP to verify your account",
            // text: `Your OTP is ${otp}.
            //  Verify your account with this OTP.`
            html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", User.email)
        }

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: "OTP sent to email" });


    } catch (error) {
        res.json({ message: false, message: error.message })
    }
}

// Verifying email using otp

export const verifyEmail = async (req, res) => {
    const { } = req;
    const { userId } = req;
    const { otp } = req.body;

    if (!userId || !otp) {
        return res.json({ success: false, message: "Missing Details" })
    }

    try {
        const User = await userModel.findById(userId);

        if (!User) {
            return res.json({ success: true, message: "User Not Found" })
        }

        if (User.verifyOtp === '' || User.verifyOtp !== otp) {
            return res.json({ success: false, message: "Invalid OTP" })
        }

        if (User.verifyOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: "OTP is expired" })
        }

        User.isAccountVerified = true;
        User.verifyOtp = '';
        User.verifyOtpExpireAt = 0;

        await User.save();

        return res.json({ success: true, message: "Email Verified Successfully" })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Check if user Logged in

export const isAuthenticated = async (req, res) => {
    try {
        res.json({ success: true });
    }
    catch (err) {
        res.json({ success: false, message: err.message })
    }
}

// Reset OTP

export const sendResetOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        res.json({ success: false, message: "Please provide email" })
    }

    try {
        const User = await userModel.findOne({ email });

        const otp = String(Math.floor(100000 + Math.random() * 900000))

        User.resetOtp = otp;

        User.resetOtpExpireAt = Date.now() + 15 * 60 * 1000

        await User.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: User.email,
            subject: "OTP to reset you password",
            // text: `Your OTP is ${otp}.
            //  Reset your account password using this otp`
            html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", User.email)
        }

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: "Password OTP sent to email" })

    }
    catch (err) {
        res.json({success: false, message: err.message})
    }
}

export const verifyResetOtp = async (req, res) => {
    const {email, otp, newPassword} = req.body;

    try {
        const User = await userModel.findOne({email});

        if (!User) {
            return res.json({ success: true, message: "User Not Found" })
        }

        if (User.resetOtp === '' || User.resetOtp !== otp) {
            return res.json({ success: false, message: "Invalid OTP" })
        }

        if (User.resetOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: "OTP is expired" })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        User.resetOtp = '';
        User.resetOtpExpireAt = 0;
        User.password = hashedPassword;

        await User.save();

        res.json({success: true, message: "Password reset Success!"})

    } catch (err) {
        res.json({success: false, message: err.message});
    }
}