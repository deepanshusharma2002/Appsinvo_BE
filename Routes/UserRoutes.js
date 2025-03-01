const express = require('express');
const { createUser, toggleUserStatus, getDistance, getUserListing } = require('../Controller/UserController');
const verifyToken = require('../Utils/verifyToken');
const router = express.Router();

// Route to create a new user
router.post('/register', createUser)
// Protected route to toggle all users' status
.put('/toggle-status', verifyToken, toggleUserStatus)
// Protected route to get distance
.post('/get-distance', verifyToken, getDistance)
// Protected route to get users by day
.post('/user-listing', verifyToken, getUserListing);

module.exports = router;