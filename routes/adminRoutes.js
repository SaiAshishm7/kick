const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Turf = require('../models/Turf');
const User = require('../models/User');
const Review = require('../models/Review');

// 1. Get all bookings
router.get('/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().populate('userId', 'name email').populate('turfId', 'name location');
        res.status(200).json(bookings);
    } catch (err) {
        res.status(400).json({ message: 'Error fetching bookings', error: err });
    }
});

// 2. Update booking status (Modify/Cancel)
router.put('/bookings/:id', async (req, res) => {
    try {
        const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: 'Booking updated successfully', updatedBooking });
    } catch (err) {
        res.status(400).json({ message: 'Error updating booking', error: err });
    }
});

// 3. Delete a booking
router.delete('/bookings/:id', async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: 'Error deleting booking', error: err });
    }
});

// 4. Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'name email');
        res.status(200).json(users);
    } catch (err) {
        res.status(400).json({ message: 'Error fetching users', error: err });
    }
});

// 5. Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: 'Error deleting user', error: err });
    }
});

// 6. Delete review
router.delete('/reviews/:id', async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });
        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: 'Error deleting review', error: err });
    }
});

module.exports = router;
