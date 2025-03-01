const User = require('../Models/UserModel'); // Import the User model
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const jwt = require('jsonwebtoken'); // Import JWT for token generation
require('dotenv').config(); // Load environment variables

// Controller function to create a new user
const createUser = async (req, res, next) => {
    try {
        // Destructure request body
        const { name, email, password, address, latitude, longitude } = req.body;

        // Validate required fields
        if (!name || !email || !password || !address || !latitude || !longitude) {
            return res.status(400).json({
                status_code: 400,
                message: "All fields are required",
                data: null
            });
        }

        
        // ✅ Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status_code: 400,
                message: "Invalid email format",
                data: null
            });
        }

        // ✅ Validate latitude & longitude (must be valid float numbers)
        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                status_code: 400,
                message: "Latitude and Longitude must be valid numbers",
                data: null
            });
        }

        // Check if the email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status_code: 400,
                message: "Email is already registered",
                data: null
            });
        }

        // Convert hash rounds to a number (default to 10 if undefined)
        const hashRounds = parseInt(process.env.HASH_ROUNDS) || 10;

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, hashRounds);

        const currentDay = new Date().getDay();

        // Create new user object
        const newUser = new User({
            name,
            email,
            password: hashedPassword, // Store the hashed password
            address,
            latitude,
            longitude,
            status: "active", // Default status is active
            day: currentDay, // Automatically set the current day
        });

        // Save user to database
        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: newUser._id,
                name: newUser.name,
                email: newUser.email,
                address: newUser.address,
                latitude: newUser.latitude,
                longitude: newUser.longitude,
                day: newUser.day,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Send response
        return res.status(201).json({
            status_code: 201,
            message: "User created successfully",
            data: {
                name: newUser.name,
                email: newUser.email,
                address: newUser.address,
                latitude: newUser.latitude,
                longitude: newUser.longitude,
                status: newUser.status,
                register_at: newUser.register_at,
                token
            }
        });
    } catch (error) {
        console.error("Error creating user:", error);
        next(error);
    }
};

const toggleUserStatus = async (req, res, next) => {
    try {
        // Update all users' status in a single query
        const result = await User.updateMany(
            {}, 
            [{ $set: { status: { $cond: { if: { $eq: ["$status", "active"] }, then: "inactive", else: "active" } } } }]
        );

        // Send response
        return res.status(200).json({
            status_code: 200,
            message: "All users' status updated successfully",
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error("Error updating users' status:", error);
        next(error);
    }
};

const getDistance = async (req, res, next) => {
    try {
        const { latitude: userLat, longitude: userLong } = req.user;

        // Get destination coordinates from request body
        const { destination_latitude, destination_longitude } = req.body;

        if (!destination_latitude || !destination_longitude) {
            return res.status(400).json({
                status_code: 400,
                message: "Destination latitude and longitude are required",
                data: null
            });
        }

        // Function to calculate distance using the Haversine formula
        const haversineDistance = (lat1, lon1, lat2, lon2) => {
            const toRad = (value) => (value * Math.PI) / 180;
            const R = 6371; // Radius of Earth in kilometers

            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);

            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);

            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; // Distance in kilometers
        };

        // Calculate distance
        const distance = haversineDistance(userLat, userLong, destination_latitude, destination_longitude).toFixed(2);

        // Send response
        return res.status(200).json({
            status_code: 200,
            message: "Distance calculated successfully",
            distance: `${distance} km`
        });

    } catch (error) {
        console.error("Error calculating distance:", error);
        next(error);
    }
};

const getUserListing = async (req, res, next) => {
    try {
        // Extract week numbers (days) from request body
        let { week_number } = req.body;
        
        if (!week_number || !Array.isArray(week_number)) {
            return res.status(400).json({
                status_code: 400,
                message: "week_number array is required",
                data: null
            });
        }

        // Validate day numbers (0 to 6)
        const validDays = [0, 1, 2, 3, 4, 5, 6];
        week_number = week_number.filter(day => validDays.includes(day));

        if (week_number.length === 0) {
            return res.status(400).json({
                status_code: 400,
                message: "Invalid days provided. Use numbers between 0 (Sunday) to 6 (Saturday).",
                data: null
            });
        }

        // Fetch users for selected days efficiently using an index
        const users = await User.find(
            { day: { $in: week_number } }, 
            { name: 1, email: 1, day: 1, _id: 0 } // Project only required fields
        ).lean(); // Use `.lean()` to return plain JS objects (reduces memory overhead)

        // Map numeric days to names
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const groupedUsers = {};

        // Organize users by day
        week_number.forEach(day => groupedUsers[dayNames[day]] = []);

        users.forEach(user => {
            const dayName = dayNames[user.day];
            groupedUsers[dayName].push({ name: user.name, email: user.email });
        });

        // Send response
        return res.status(200).json({
            status_code: 200,
            message: "User listing retrieved successfully",
            data: groupedUsers
        });

    } catch (error) {
        console.error("Error fetching user listing:", error);
        next(error);
    }
};

module.exports = { createUser, toggleUserStatus, getDistance, getUserListing };
