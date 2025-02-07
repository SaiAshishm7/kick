const Booking = require('../models/Booking');
const Turf = require('../models/Turf');

// Create a booking
exports.createBooking = async (req, res) => {
    const { userId, turfId, sport, date, startTime, endTime } = req.body;

    try {
        const turf = await Turf.findById(turfId);
        if (!turf) {
            return res.status(404).json({ message: 'Turf not found!' });
        }

        // Check if time slot is available
        const existingBooking = await Booking.findOne({
            turf: turfId,
            date,
            $or: [
                { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
                { startTime: { $gte: startTime, $lt: endTime } }
            ]
        });

        if (existingBooking) {
            return res.status(400).json({ message: 'Time slot is already booked!' });
        }

        const totalPrice = turf.pricePerHour * (parseInt(endTime) - parseInt(startTime));

        const newBooking = new Booking({
            user: userId,
            turf: turfId,
            sport,
            date,
            startTime,
            endTime,
            totalPrice
        });

        await newBooking.save();
        res.status(201).json({ message: 'Booking created successfully!', booking: newBooking });
    } catch (err) {
        res.status(500).json({ message: 'Server error!' });
    }
};

// Modify a booking
exports.modifyBooking = async (req, res) => {
    const { id } = req.params;
    const { startTime, endTime } = req.body;

    try {
        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ message: 'Booking not found!' });

        // Check for availability for the modified time slot
        const existingBooking = await Booking.findOne({
            turf: booking.turf,
            date: booking.date,
            $or: [
                { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
                { startTime: { $gte: startTime, $lt: endTime } }
            ]
        });

        if (existingBooking) return res.status(400).json({ message: 'Time slot is already booked!' });

        booking.startTime = startTime;
        booking.endTime = endTime;

        await booking.save();
        res.status(200).json({ message: 'Booking modified successfully!', booking });
    } catch (err) {
        res.status(500).json({ message: 'Server error!' });
    }
};

// Cancel a booking
exports.cancelBooking = async (req, res) => {
    const { id } = req.params;

    try {
        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ message: 'Booking not found!' });

        await booking.remove();
        res.status(200).json({ message: 'Booking canceled successfully!' });
    } catch (err) {
        res.status(500).json({ message: 'Server error!' });
    }
};

// Get bookings for a user
exports.getBookingsForUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const bookings = await Booking.find({ user: userId }).populate('turf');
        res.status(200).json({ bookings });
    } catch (err) {
        res.status(500).json({ message: 'Server error!' });
    }
};
const sendEmail = require('../utils/nodemailer');

// Create a booking
exports.createBooking = async (req, res) => {
    const { userId, turfId, sport, date, startTime, endTime } = req.body;

    try {
        const turf = await Turf.findById(turfId);
        if (!turf) {
            return res.status(404).json({ message: 'Turf not found!' });
        }

        // Check if time slot is available
        const existingBooking = await Booking.findOne({
            turf: turfId,
            date,
            $or: [
                { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
                { startTime: { $gte: startTime, $lt: endTime } }
            ]
        });

        if (existingBooking) {
            return res.status(400).json({ message: 'Time slot is already booked!' });
        }

        const totalPrice = turf.pricePerHour * (parseInt(endTime) - parseInt(startTime));

        const newBooking = new Booking({
            user: userId,
            turf: turfId,
            sport,
            date,
            startTime,
            endTime,
            totalPrice
        });

        await newBooking.save();

        // Send confirmation email to user
        const user = await User.findById(userId);
        const userEmail = user.email;
        const subject = `Booking Confirmation for ${sport} at ${turf.name}`;
        const text = `Your booking for ${sport} at ${turf.name} on ${date} from ${startTime} to ${endTime} is confirmed. Total Price: $${totalPrice}`;

        sendEmail(userEmail, subject, text);

        // Send confirmation email to admin
        const admin = await Admin.findOne({});  // Assuming one admin
        const adminEmail = admin.email;
        const adminSubject = `New Booking for ${sport} at ${turf.name}`;
        const adminText = `A new booking has been made for ${sport} at ${turf.name} on ${date} from ${startTime} to ${endTime}. Total Price: $${totalPrice}`;

        sendEmail(adminEmail, adminSubject, adminText);

        res.status(201).json({ message: 'Booking created successfully!', booking: newBooking });
    } catch (err) {
        res.status(500).json({ message: 'Server error!' });
    }
};
