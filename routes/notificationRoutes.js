const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// Get upcoming bookings
router.get('/:userId/upcoming', async (req, res) => {
    try {
        const { userId } = req.params;
        const today = new Date();

        const upcomingBookings = await Booking.find({
            userId,
            date: { $gte: today },
            status: 'Booked'
        }).populate('turfId', 'name location');

        res.status(200).json(upcomingBookings);
    } catch (err) {
        res.status(400).json({ message: 'Error fetching upcoming bookings', error: err });
    }
});

// Get past bookings
router.get('/:userId/past', async (req, res) => {
    try {
        const { userId } = req.params;
        const today = new Date();

        const pastBookings = await Booking.find({
            userId,
            date: { $lt: today }
        }).populate('turfId', 'name location');

        res.status(200).json(pastBookings);
    } catch (err) {
        res.status(400).json({ message: 'Error fetching past bookings', error: err });
    }
});

module.exports = router;
