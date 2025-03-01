const express = require('express'); // Import Express framework
const mongoose = require('mongoose'); // Import Mongoose for MongoDB interaction
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const cors = require('cors'); // Import CORS to handle cross-origin requests
const handleError = require('./Utils/handleError'); // Custom error handling middleware
require('dotenv').config({ path: './Models/.env' }); // Load environment variables from .env file

const app = express(); // Initialize Express app

app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // Middleware to parse JSON request bodies

// Connect to MongoDB using environment variable for connection string
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB'); // Log success message on successful connection
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message); // Log error message on connection failure
    });

// Import user routes
const userRoutes = require("./Routes/UserRoutes");

// Use user routes with base path "/api"
app.use("/api", userRoutes);

// Global error handling middleware
app.use(handleError);

// Define the port for the server
const PORT = 5000;

// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
