const Booking = require('../models/Booking');
const Turf = require('../models/Turf');
const User = require('../models/User');

// Helper function to parse time string to minutes since midnight
const parseTimeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

// Helper function to calculate duration in hours
const calculateDuration = (startTime, endTime) => {
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    return (endMinutes - startMinutes) / 60;
};

// Create a booking
exports.createBooking = async (req, res) => {
    console.log('=== New Booking Request ===');
    console.log('Raw request body:', req.body);

    try {
        // Validate required fields
        if (!req.body.user || !req.body.turf) {
            return res.status(400).json({
                message: 'Missing required fields',
                details: {
                    user: !req.body.user ? 'User ID is required' : undefined,
                    turf: !req.body.turf ? 'Turf ID is required' : undefined
                }
            });
        }

        // Create new booking with fields matching the Booking model
        const newBooking = new Booking({
            user: req.body.user,     // Matches 'user' field in model
            turf: req.body.turf,     // Matches 'turf' field in model
            sport: req.body.sport || 'football',
            date: req.body.date,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            status: 'pending',
            paymentStatus: 'pending'
        });

        // Log the booking object before saving
        console.log('Booking object before save:', {
            user: newBooking.user,
            turf: newBooking.turf,
            sport: newBooking.sport,
            date: newBooking.date,
            startTime: newBooking.startTime,
            endTime: newBooking.endTime
        });

        // Save the booking
        await newBooking.save();
        console.log('Booking saved successfully');

        // Populate turf details for response
        await newBooking.populate('turf', 'name location hourlyPrice');

        res.status(201).json({
            message: 'Booking created successfully!',
            booking: {
                id: newBooking._id,
                turf: newBooking.turf,
                date: newBooking.date,
                startTime: newBooking.startTime,
                endTime: newBooking.endTime,
                sport: newBooking.sport,
                totalPrice: newBooking.totalPrice,
                status: newBooking.status
            }
        });
    } catch (err) {
        console.error('Error creating booking:', err);
        res.status(500).json({
            message: 'Server error during booking creation',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
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
;
