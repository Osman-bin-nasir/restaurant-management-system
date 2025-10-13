import mongoose from "mongoose";
import Role from "./Role.js";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    employeeId: { type: String },
    shift: { type: String, enum: ['morning', 'evening', 'night'] },
    attendance: [
        {
            date: { type: Date, default: Date.now },
            status: { type: String, enum: ['present', 'absent', 'leave'], default: 'present' }
        }
    ],
    isActive: { type: Boolean, default: true },
    verifyOtp: {
        type: String,
        default: '',
    },
    verifyOtpExpireAt: {
        type: Number,
        default: 0,
    },
    isAccountVerified: {
        type: Boolean,
        default: false
    },
    resetOtp: {
        type: String,
        default: '',
    },
    resetOtpExpireAt: {
        type: Number,
        default: 0,
    },
});

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;