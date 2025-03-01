const jwt = require('jsonwebtoken');
const User = require('../Models/UserModel');
require('dotenv').config();

const verifyToken = async (req, res, next) => {
    try {
        // Get the token from the request headers
        const token = req.header('Authorization');

        // Check if the token is provided
        if (!token) {
            return res.status(401).json({
                status_code: 401,
                message: "Access denied. No token provided.",
                data: null
            });
        }

        // Verify the token
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);

        // Verify the user status
        const VerifyUserStatus = await User.findOne({ _id: decoded.userId });

        if (VerifyUserStatus.status !== "active") {
            return res.status(400).json({
                status_code: 400,
                message: "User is not authorized",
                data: null
            });
        }
        // Attach user details to request object
        req.user = VerifyUserStatus;

        // Call next middleware or route handler
        next();
    } catch (error) {
        return res.status(401).json({
            status_code: 401,
            message: "Invalid or expired token",
            data: null
        });
    }
};

module.exports = verifyToken;
