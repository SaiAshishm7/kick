const express = require('express');
const router = express.Router();
const {
    getAllBookings,
    getAllUsers,
    updateTurfAvailability
} = require('../controllers/adminController');

// Get all bookings (admin access)
router.get('/bookings', getAllBookings);

// Get all users (admin access)
router.get('/users', getAllUsers);

// Update turf availability (admin access)
router.put('/turf/availability/:turfId', updateTurfAvailability);

module.exports = router;
