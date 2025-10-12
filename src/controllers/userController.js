import userModel from "../models/User.js";

export const getUserData = async (req, res) => {
    try {
        const {userId} = req;

        const User = await userModel.findById(userId);

        if(!User) {
            res.json({success: false, message:"User not found!"})
        }

        res.json({
            success: true,
            userData: {
                name: User.name,
                isAccountVerified: User.isAccountVerified,
            }
        })

    } catch (error) {
        res.json({success: false, message: err.message})
    }
}