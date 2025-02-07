const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Turf = require('../models/Turf');

// Create a Booking
router.post('/create', async (req, res) => {
    try {
        const { user, turf, sport, date, startTime, endTime } = req.body;

        // Fetch Turf details
        const selectedTurf = await Turf.findById(turf);
        if (!selectedTurf) {
            return res.status(404).json({ message: 'Turf not found' });
        }

        // Check for overlapping bookings
        const existingBooking = await Booking.findOne({
            turf,
            date,
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } }
            ]
        });

        if (existingBooking) {
            return res.status(400).json({ message: 'Time slot already booked' });
        }

        // Calculate total cost
        const totalCost = selectedTurf.hourlyPrice * ((parseInt(endTime) - parseInt(startTime)) / 60);

        // Create a new booking
        const booking = new Booking({ user, turf, sport, date, startTime, endTime, totalCost });
        await booking.save();

        res.status(201).json({ message: 'Booking successful', booking });
    } catch (err) {
        res.status(400).json({ message: 'Error creating booking', error: err });
    }
});

// Get User’s Bookings (Upcoming & Past)
router.get('/user/:userId', async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.params.userId }).sort({ date: 1, startTime: 1 });
        res.status(200).json(bookings);
    } catch (err) {
        res.status(400).json({ message: 'Error fetching bookings', error: err });
    }
});

// Cancel a Booking
router.delete('/:bookingId', async (req, res) => {
    try {
        const deletedBooking = await Booking.findByIdAndDelete(req.params.bookingId);
        if (!deletedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.status(200).json({ message: 'Booking cancelled successfully' });
    } catch (err) {
        res.status(400).json({ message: 'Error cancelling booking', error: err });
    }
});

// Get all bookings
router.get('/', async (req, res) => {
    try {
        const bookings = await Booking.find().populate('user', 'name email').populate('turf', 'name location availableSports');
        res.status(200).json(bookings);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching bookings', error: err });
    }
});
module.exports = router;
