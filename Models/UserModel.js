const mongoose = require('mongoose'); // Import mongoose library
const { Schema } = mongoose; // Extract Schema from mongoose

// Define the schema for the User collection
const userSchema = new Schema({
    name: { type: String, required: true }, // User's name (required)
    email: { type: String, required: true, unique: true }, // User's email (required & must be unique)
    password: { type: String, required: true }, // Hashed password (required)
    address: { type: String, required: true }, // User's address (required)
    latitude: { type: String, required: true }, // Latitude for location (required)
    longitude: { type: String, required: true }, // Longitude for location (required)
    status: { type: String, default: "active" }, // User's status, default is "active"
    register_at: { type: Date, default: Date.now }, // Registration timestamp, defaults to current date/time
    day: { 
        type: Number, 
        required: true, 
        min: 0, 
        max: 6 
    } // Day of the week (0 = Sunday, 6 = Saturday) with validation
});

// Create a User model from the schema
const UserSchema = mongoose.model('User', userSchema);

module.exports = UserSchema; // Export the User model for use in other files
