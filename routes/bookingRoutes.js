const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Turf = require('../models/Turf');

// Get all bookings for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.params.userId })
            .populate('turfId', 'name location hourlyPrice')
            .sort({ date: 1, startTime: 1 });

        // Separate bookings into upcoming and past
        const now = new Date();
        const [upcoming, past] = bookings.reduce(
            ([upcoming, past], booking) => {
                const bookingDate = new Date(booking.date);
                return bookingDate >= now 
                    ? [[...upcoming, booking], past]
                    : [upcoming, [...past, booking]];
            },
            [[], []]
        );

        res.json({ upcoming, past });
    } catch (err) {
        console.error('Error fetching user bookings:', err);
        res.status(500).json({ message: 'Error fetching bookings' });
    }
});

// Cancel a booking
router.post('/:bookingId/cancel', async (req, res) => {
    try {
        console.log('Cancelling booking:', req.params.bookingId);
        const booking = await Booking.findById(req.params.bookingId);
        
        if (!booking) {
            console.log('Booking not found');
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check if booking is already cancelled
        if (booking.status === 'Cancelled') {
            console.log('Booking already cancelled');
            return res.status(400).json({ message: 'Booking is already cancelled' });
        }

        // Check if booking is in the past
        const bookingDate = new Date(booking.date);
        const now = new Date();
        if (bookingDate < now) {
            console.log('Cannot cancel past booking');
            return res.status(400).json({ message: 'Cannot cancel past bookings' });
        }

        booking.status = 'Cancelled';
        const updatedBooking = await booking.save();
        console.log('Booking cancelled successfully:', updatedBooking);

        res.json({ 
            message: 'Booking cancelled successfully', 
            booking: updatedBooking 
        });
    } catch (err) {
        console.error('Error cancelling booking:', err);
        res.status(500).json({ message: 'Error cancelling booking' });
    }
});

router.post('/', async (req, res) => {
    try {
        console.log('\n=== New Booking Request ===');
        console.log('Request body:', req.body);
        
        const { userId, turfId, date, startTime, endTime } = req.body;
        
        // Validate required fields
        if (!userId || !turfId || !date || !startTime || !endTime) {
            console.log('❌ Booking Failed: Missing required fields');
            console.log('Missing fields:', {
                userId: !userId,
                turfId: !turfId,
                date: !date,
                startTime: !startTime,
                endTime: !endTime
            });
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Fetch Turf details
        console.log('🔍 Finding turf with ID:', turfId);
        const turf = await Turf.findById(turfId);
        if (!turf) {
            console.log('❌ Booking Failed: Turf not found');
            return res.status(404).json({ message: 'Turf not found' });
        }
        console.log('✅ Found turf:', turf.name);

        // Calculate total price
        console.log('💰 Calculating price...');
        
        // Convert times to 24-hour format for calculation
        const convertTo24Hour = (timeStr) => {
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':');
            hours = parseInt(hours);
            
            if (hours === 12) {
                hours = modifier === 'PM' ? 12 : 0;
            } else if (modifier === 'PM') {
                hours = hours + 12;
            }
            
            return hours;
        };

        const startHour = convertTo24Hour(startTime);
        const endHour = convertTo24Hour(endTime);
        
        // Validate time range
        if (endHour <= startHour) {
            console.log('❌ Booking Failed: End time must be after start time');
            return res.status(400).json({ message: 'End time must be after start time' });
        }

        const duration = endHour - startHour;
        const totalPrice = turf.hourlyPrice * duration;
        console.log(`Start: ${startHour}:00, End: ${endHour}:00`);
        console.log(`Duration: ${duration} hours, Price per hour: ₹${turf.hourlyPrice}, Total: ₹${totalPrice}`);

        // Check for overlapping bookings
        console.log('🔍 Checking for overlapping bookings...');
        const existingBooking = await Booking.findOne({
            turfId,
            date,
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } }
            ]
        });

        if (existingBooking) {
            console.log('❌ Booking Failed: Time slot already booked');
            return res.status(400).json({ message: 'Time slot already booked' });
        }
        console.log('✅ Time slot is available');

        // Create a new booking
        console.log('📝 Creating new booking...');
        const booking = new Booking({
            userId,
            turfId,
            date,
            startTime,
            endTime,
            totalPrice
        });

        await booking.save();
        console.log('✅ Booking successful!');
        console.log('Booking details:', {
            id: booking._id,
            turf: turf.name,
            date,
            startTime,
            endTime,
            totalPrice
        });
        res.status(201).json({ message: 'Booking successful', booking });
    } catch (err) {
        console.log('❌ Booking Failed: Error occurred');
        console.error('Error details:', err);
        res.status(400).json({ message: 'Error creating booking', error: err.message });
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

// Modify Booking
router.put('/modify/:id', async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.status(200).json({ message: 'Booking modified successfully', booking });
    } catch (err) {
        res.status(400).json({ message: 'Error modifying booking', error: err });
    }
});

// Check Turf Availability for a Specific Date
router.get('/availability/:turfId/:date', async (req, res) => {
    try {
        const { turfId, date } = req.params;
        const bookings = await Booking.find({ turf: turfId, date });

        res.status(200).json({ message: 'Availability fetched', bookings });
    } catch (err) {
        res.status(400).json({ message: 'Error fetching availability', error: err });
    }
});

module.exports = router;
