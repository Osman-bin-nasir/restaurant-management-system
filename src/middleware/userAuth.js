import jwt from 'jsonwebtoken';
import userModel from '../models/User.js';

const userAuth = async(req, res, next) => {
    const {token} = req.cookies;

    if(!token) {
        return res.json({success: false, message: "Not Authorized"});
    }

    try {
        
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decodedToken.id).select('-password'); // exclude password

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        req.user = user; // attach full user object
        next();
        
    } catch (error) {
        return res.json({success: false, message: error.message})
    }
}

export default userAuth;