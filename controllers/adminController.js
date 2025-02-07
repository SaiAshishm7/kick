const Booking = require('../models/Booking');
const User = require('../models/User');
const Turf = require('../models/Turf');

// Get all bookings for admin
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('user turf');
        res.status(200).json(bookings);
    } catch (err) {
        res.status(500).json({ message: 'Server error!' });
    }
};

// Get all users for admin
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error!' });
    }
};

// Update turf availability (admin)
exports.updateTurfAvailability = async (req, res) => {
    const { turfId } = req.params;
    const { isAvailable } = req.body;

    try {
        const turf = await Turf.findById(turfId);
        if (!turf) {
            return res.status(404).json({ message: 'Turf not found!' });
        }

        turf.isAvailable = isAvailable;
        await turf.save();

        res.status(200).json({ message: 'Turf availability updated!', turf });
    } catch (err) {
        res.status(500).json({ message: 'Server error!' });
    }
};
