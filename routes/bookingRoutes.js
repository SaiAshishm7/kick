const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Turf = require('../models/Turf');
const { sendBookingConfirmationEmail } = require('../utils/nodemailer');
const User = require('../models/User');
const RecurringBooking = require('../models/RecurringBooking');
const Waitlist = require('../models/Waitlist');
const Loyalty = require('../models/Loyalty');
const NotificationService = require('../utils/notifications');
const Analytics = require('../models/Analytics');
const RecommendationEngine = require('../utils/recommendationEngine');
const Payment = require('../models/Payment');

// Get all bookings for a user
router.get('/user/:user', async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.params.user })
            .populate('turf', 'name location hourlyPrice')
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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log('\n=== New Booking Request ===');
        console.log('Request body:', req.body);
        
        const { user, turf, date, startTime, endTime, sport } = req.body;
        
        // Normalize sport to lowercase
        const normalizedSport = sport ? sport.toLowerCase().trim() : null;
        
        // Validate required fields
        const requiredFields = { user, turf, date, startTime, endTime, sport: normalizedSport };
        const missingFields = Object.entries(requiredFields)
            .filter(([key, value]) => !value)
            .map(([key]) => key);

        if (missingFields.length > 0) {
            console.log('❌ Booking Failed: Missing required fields');
            console.log('Missing fields:', missingFields);
            return res.status(400).json({ 
                message: 'Missing required fields', 
                missingFields 
            });
        }

        // Validate sport against turf's available sports
        const turfDocument = await Turf.findById(turf);
        if (!turfDocument) {
            return res.status(404).json({ message: 'Turf not found' });
        }

        const validSports = turfDocument.sports.map(s => s.toLowerCase());
        if (!validSports.includes(normalizedSport)) {
            return res.status(400).json({ 
                message: 'Invalid sport', 
                validSports: validSports 
            });
        }

        // Fetch Turf details
        console.log('🔍 Finding turf with ID:', turf);
        console.log('Turf ID Type:', typeof turf);
        const turfDetails = await Turf.findById(turf);
        
        if (!turfDetails) {
            return res.status(404).json({ message: 'Turf not found' });
        }

        // Calculate duration and total price
        const startDateTime = new Date(`${date}T${startTime}`);
        const endDateTime = new Date(`${date}T${endTime}`);
        const duration = (endDateTime - startDateTime) / (1000 * 60 * 60); // hours
        
        const calculatedTotalPrice = duration * turfDetails.hourlyPrice;
        
        console.log(`Start: ${startTime}, End: ${endTime}`);
        console.log(`Duration: ${duration} hours, Price per hour: ₹${turfDetails.hourlyPrice}, Total: ₹${calculatedTotalPrice}`);

        // Check time slot availability
        const existingBookings = await Booking.find({
            turf: turf,
            date: date,
            $or: [
                { 
                    startTime: { $lt: endTime }, 
                    endTime: { $gt: startTime } 
                }
            ]
        });

        if (existingBookings.length > 0) {
            return res.status(400).json({ 
                message: 'Time slot already booked', 
                existingBookings 
            });
        }

        // Create booking
        const booking = new Booking({
            user,
            turf,
            sport: normalizedSport,
            date,
            startTime,
            endTime,
            totalPrice: calculatedTotalPrice,
            status: 'confirmed' // Changed to lowercase
        });

        await booking.save();

        // Update User Loyalty and Booking Stats
        const currentUser = await User.findById(booking.user);
        if (currentUser) {
            // Calculate loyalty points (1 point per 100 rupees)
            const pointsEarned = Math.floor(booking.totalPrice / 100);
            currentUser.loyaltyPoints += pointsEarned;
            currentUser.totalBookings += 1;
            currentUser.totalSpent += booking.totalPrice;

            // Update Loyalty Tier
            if (currentUser.loyaltyPoints > 1000) currentUser.loyaltyTier = 'Platinum';
            else if (currentUser.loyaltyPoints > 500) currentUser.loyaltyTier = 'Gold';
            else if (currentUser.loyaltyPoints > 200) currentUser.loyaltyTier = 'Silver';

            await currentUser.save();
        }

        // Update Analytics
        let analytics = await Analytics.findOne();
        if (!analytics) {
            analytics = new Analytics();
        }

        await analytics
            .updateBookingStats(booking)
            .updateRevenueStats(booking)
            .updateUsageStats(booking);

        await analytics.save();

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        // Send booking confirmation email
        try {
            if (currentUser && currentUser.email) {
                await sendBookingConfirmationEmail({ 
                    ...booking.toObject(), 
                    turfName: turfDetails.name,
                    loyaltyPointsEarned: pointsEarned,
                    newLoyaltyTier: currentUser.loyaltyTier
                }, currentUser.email);
                console.log('✉️ Booking confirmation email sent successfully');
            }
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError);
        }

        return res.status(201).json({
            message: 'Booking successful',
            booking: {
                id: booking._id,
                turf: turfDetails.name,
                date,
                startTime,
                endTime,
                sport: normalizedSport,
                totalPrice: calculatedTotalPrice,
                status: 'confirmed',
                loyaltyPointsEarned: pointsEarned,
                newLoyaltyTier: currentUser ? currentUser.loyaltyTier : null
            }
        });

    } catch (err) {
        // Rollback transaction
        await session.abortTransaction();
        session.endSession();

        console.error('❌ Booking Creation Error:', err);
        
        // Ensure headers haven't already been sent
        if (!res.headersSent) {
            return res.status(500).json({ 
                message: 'Server error during booking creation', 
                error: process.env.NODE_ENV === 'development' ? err.message : undefined 
            });
        } else {
            console.error('Headers already sent. Cannot send error response.');
        }
    }
});

// Get User’s Bookings (Upcoming & Past)
router.get('/user/:user', async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.params.user }).sort({ date: 1, startTime: 1 });
        res.status(200).json(bookings);
    } catch (err) {
        res.status(400).json({ message: 'Error fetching bookings', error: err });
    }
});

// Cancel a Booking
router.delete('/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { reason } = req.body;

        // Find the booking
        const booking = await Booking.findById(bookingId)
            .populate('user', 'name email')
            .populate('turf', 'name');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check if booking is already cancelled
        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Booking is already cancelled' });
        }

        // Calculate refund
        const cancellationTime = new Date();
        const refundDetails = booking.calculateRefund(cancellationTime);

        // Update booking status and refund details
        booking.status = 'cancelled';
        booking.paymentStatus = refundDetails.refundAmount > 0 ? 'refunded' : 'failed';
        booking.cancellationReason = reason || 'No reason provided';
        booking.refundAmount = refundDetails.refundAmount;
        booking.cancellationFee = refundDetails.cancellationFee;

        await booking.save();

        // Send cancellation email
        try {
            await sendBookingCancellationEmail(booking);
        } catch (emailError) {
            console.error('Error sending cancellation email:', emailError);
        }

        res.status(200).json({ 
            message: 'Booking cancelled successfully', 
            refundDetails: {
                refundAmount: refundDetails.refundAmount,
                cancellationFee: refundDetails.cancellationFee,
                refundPercentage: refundDetails.refundPercentage * 100
            }
        });
    } catch (err) {
        console.error('Booking Cancellation Error:', err);
        res.status(500).json({ 
            message: 'Error cancelling booking', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

// Update booking status
router.patch('/:bookingId/status', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: 'Invalid status', 
                validStatuses 
            });
        }

        const booking = await Booking.findByIdAndUpdate(
            bookingId, 
            { status }, 
            { new: true, runValidators: true }
        );

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.status(200).json({ 
            message: 'Booking status updated successfully', 
            booking: {
                id: booking._id,
                status: booking.status
            }
        });
    } catch (err) {
        console.error('Booking Status Update Error:', err);
        res.status(500).json({ 
            message: 'Error updating booking status', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

// Get Booking Details
router.get('/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId)
            .populate('user', 'name email')
            .populate('turf', 'name location hourlyPrice');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.status(200).json({
            booking: {
                id: booking._id,
                turf: booking.turf,
                user: booking.user,
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime,
                sport: booking.sport,
                totalPrice: booking.totalPrice,
                status: booking.status,
                paymentStatus: booking.paymentStatus,
                duration: booking.duration
            }
        });
    } catch (err) {
        console.error('Booking Details Retrieval Error:', err);
        res.status(500).json({ 
            message: 'Error retrieving booking details', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
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
router.get('/availability/:turf/:date', async (req, res) => {
    try {
        const { turf, date } = req.params;
        const bookings = await Booking.find({ turf, date });

        res.status(200).json({ message: 'Availability fetched', bookings });
    } catch (err) {
        res.status(400).json({ message: 'Error fetching availability', error: err });
    }
});

// Create Recurring Booking
router.post('/recurring', async (req, res) => {
    try {
        const { 
            user, 
            turf, 
            sport, 
            startDate, 
            endDate, 
            recurringPattern, 
            daysOfWeek, 
            startTime, 
            endTime,
            groupDiscount
        } = req.body;

        const recurringBooking = new RecurringBooking({
            user,
            turf,
            sport,
            startDate,
            endDate,
            recurringPattern,
            daysOfWeek,
            startTime,
            endTime,
            groupDiscount
        });

        // Calculate total price
        const turfDetails = await Turf.findById(turf);
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        const duration = endHour - startHour + (endMinute - startMinute) / 60;
        
        // Apply group discount
        const basePrice = turfDetails.hourlyPrice * duration;
        const discountedPrice = basePrice * (1 - (groupDiscount || 0) / 100);
        recurringBooking.totalPrice = Math.round(discountedPrice);

        await recurringBooking.save();

        // Generate individual bookings
        const bookings = await recurringBooking.generateBookings();
        await Booking.insertMany(bookings);

        res.status(201).json({
            message: 'Recurring booking created successfully',
            recurringBooking,
            bookingsGenerated: bookings.length
        });
    } catch (err) {
        console.error('Recurring Booking Creation Error:', err);
        res.status(500).json({ 
            message: 'Error creating recurring booking', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

// Join Waitlist
router.post('/waitlist', async (req, res) => {
    try {
        const { user, turf, sport, date, startTime, endTime } = req.body;

        // Check if user already has a pending waitlist for this slot
        const existingWaitlist = await Waitlist.findOne({
            user,
            turf,
            date,
            startTime,
            endTime,
            status: 'pending'
        });

        if (existingWaitlist) {
            return res.status(400).json({ 
                message: 'You are already on the waitlist for this slot' 
            });
        }

        const waitlistEntry = new Waitlist({
            user,
            turf,
            sport,
            date,
            startTime,
            endTime
        });

        // Try to allocate immediately
        const allocatedBooking = await waitlistEntry.checkAndAllocate();

        if (allocatedBooking) {
            return res.status(200).json({
                message: 'Slot immediately allocated',
                booking: allocatedBooking
            });
        }

        await waitlistEntry.save();

        res.status(201).json({
            message: 'Added to waitlist',
            waitlistEntry
        });
    } catch (err) {
        console.error('Waitlist Creation Error:', err);
        res.status(500).json({ 
            message: 'Error joining waitlist', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

// Loyalty Points Redemption
router.post('/redeem-points', async (req, res) => {
    try {
        const { user, pointsToRedeem } = req.body;

        const loyalty = await Loyalty.findOne({ user });

        if (!loyalty) {
            return res.status(404).json({ message: 'Loyalty account not found' });
        }

        if (loyalty.points < pointsToRedeem) {
            return res.status(400).json({ 
                message: 'Insufficient loyalty points',
                currentPoints: loyalty.points
            });
        }

        // Conversion rate: 100 points = ₹10 discount
        const discountAmount = Math.floor(pointsToRedeem / 100) * 10;

        // Deduct points
        loyalty.points -= pointsToRedeem;
        await loyalty.save();

        res.status(200).json({
            message: 'Points redeemed successfully',
            discountAmount,
            remainingPoints: loyalty.points
        });
    } catch (err) {
        console.error('Points Redemption Error:', err);
        res.status(500).json({ 
            message: 'Error redeeming points', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

// Get Personalized Recommendations
router.get('/recommendations', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const recommendations = await RecommendationEngine.recommendTurfs(userId);

        if (!recommendations) {
            return res.status(404).json({ message: 'No recommendations found' });
        }

        res.json({
            message: 'Personalized recommendations',
            recommendations: recommendations.recommendations,
            preferredSport: recommendations.preferredSport,
            preferredTimeSlot: recommendations.preferredTimeSlot
        });
    } catch (err) {
        console.error('Recommendation Error:', err);
        res.status(500).json({ 
            message: 'Error fetching recommendations', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

// Dynamic Pricing Calculation
router.post('/dynamic-pricing', async (req, res) => {
    try {
        const { turfId, bookingDetails } = req.body;

        const turf = await Turf.findById(turfId);
        if (!turf) {
            return res.status(404).json({ message: 'Turf not found' });
        }

        const pricingDetails = await RecommendationEngine.calculateDynamicPricing(turf, bookingDetails);

        res.json({
            message: 'Dynamic pricing calculated',
            pricingDetails
        });
    } catch (err) {
        console.error('Dynamic Pricing Error:', err);
        res.status(500).json({ 
            message: 'Error calculating dynamic pricing', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

// Create Flexible Payment
router.post('/payment', async (req, res) => {
    try {
        const { 
            bookingId, 
            userId, 
            totalAmount, 
            paymentMethod = 'full', 
            installments = 3 
        } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const payment = new Payment({
            booking: bookingId,
            user: userId,
            totalAmount,
            paymentMethod
        });

        // Create installment plan if selected
        if (paymentMethod === 'installment') {
            payment.createInstallmentPlan(installments);
        }

        await payment.save();

        res.status(201).json({
            message: 'Payment plan created successfully',
            payment,
            installmentDetails: payment.installmentPlan
        });
    } catch (err) {
        console.error('Payment Creation Error:', err);
        res.status(500).json({ 
            message: 'Error creating payment plan', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

// Process Payment
router.post('/process-payment', async (req, res) => {
    try {
        const { 
            paymentId, 
            amount, 
            paymentMethod 
        } = req.body;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Process payment
        payment.processPayment(amount, paymentMethod);
        await payment.save();

        res.json({
            message: 'Payment processed successfully',
            remainingBalance: payment.remainingBalance,
            paymentStatus: payment.paymentStatus
        });
    } catch (err) {
        console.error('Payment Processing Error:', err);
        res.status(500).json({ 
            message: 'Error processing payment', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

// Refund Initiation
router.post('/refund', async (req, res) => {
    try {
        const { 
            paymentId, 
            reason, 
            refundAmount 
        } = req.body;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Initiate refund
        payment.initiateRefund(reason, refundAmount);
        await payment.save();

        res.json({
            message: 'Refund initiated successfully',
            refundDetails: payment.refundDetails
        });
    } catch (err) {
        console.error('Refund Initiation Error:', err);
        res.status(500).json({ 
            message: 'Error initiating refund', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

module.exports = router;
