const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Turf = require('../models/Turf');

// Apply admin middleware to all routes
router.use(adminMiddleware);

// Get overall statistics
router.get('/overall', async (req, res) => {
    try {
        const [
            totalBookings,
            totalRevenue,
            totalUsers,
            totalTurfs,
            activeUsers,
            pendingBookings
        ] = await Promise.all([
            Booking.countDocuments(),
            Booking.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            User.countDocuments(),
            Turf.countDocuments(),
            User.countDocuments({ status: 'active' }),
            Booking.countDocuments({ status: 'pending' })
        ]);

        res.json({
            totalBookings,
            totalRevenue: totalRevenue[0]?.total || 0,
            totalUsers,
            totalTurfs,
            activeUsers,
            pendingBookings
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching overall statistics', error: error.message });
    }
});

// Get revenue analytics
router.get('/revenue', async (req, res) => {
    try {
        const { period = 'daily', start, end } = req.query;
        const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = end ? new Date(end) : new Date();

        let groupBy = {
            daily: { $dateToString: { format: '%Y-%m-%d', date: '$bookingDate' } },
            weekly: { $week: '$bookingDate' },
            monthly: { $dateToString: { format: '%Y-%m', date: '$bookingDate' } }
        };

        const revenueData = await Booking.aggregate([
            {
                $match: {
                    bookingDate: { $gte: startDate, $lte: endDate },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: groupBy[period],
                    revenue: { $sum: '$totalAmount' },
                    bookings: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(revenueData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching revenue analytics', error: error.message });
    }
});

// Get turf performance analytics
router.get('/turf-performance', async (req, res) => {
    try {
        const turfPerformance = await Booking.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: '$turfId',
                    totalBookings: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' },
                    averageRating: { $avg: '$rating' }
                }
            },
            {
                $lookup: {
                    from: 'turfs',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'turfInfo'
                }
            },
            { $unwind: '$turfInfo' },
            {
                $project: {
                    turfName: '$turfInfo.name',
                    location: '$turfInfo.location',
                    totalBookings: 1,
                    totalRevenue: 1,
                    averageRating: 1
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        res.json(turfPerformance);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching turf performance', error: error.message });
    }
});

// Get user analytics
router.get('/user-analytics', async (req, res) => {
    try {
        const [
            userGrowth,
            topCustomers,
            userStatus
        ] = await Promise.all([
            // User growth over time
            User.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Top customers by booking amount
            Booking.aggregate([
                { $match: { status: 'completed' } },
                {
                    $group: {
                        _id: '$userId',
                        totalSpent: { $sum: '$totalAmount' },
                        bookingsCount: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'userInfo'
                    }
                },
                { $unwind: '$userInfo' },
                {
                    $project: {
                        name: '$userInfo.name',
                        email: '$userInfo.email',
                        totalSpent: 1,
                        bookingsCount: 1
                    }
                },
                { $sort: { totalSpent: -1 } },
                { $limit: 10 }
            ]),
            // User status distribution
            User.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        res.json({
            userGrowth,
            topCustomers,
            userStatus
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user analytics', error: error.message });
    }
});

// Get booking analytics
router.get('/booking-analytics', async (req, res) => {
    try {
        const [
            bookingTrends,
            popularTimeSlots,
            bookingStatus
        ] = await Promise.all([
            // Booking trends over time
            Booking.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$bookingDate' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Popular time slots
            Booking.aggregate([
                {
                    $group: {
                        _id: '$timeSlot',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]),
            // Booking status distribution
            Booking.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        res.json({
            bookingTrends,
            popularTimeSlots,
            bookingStatus
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching booking analytics', error: error.message });
    }
});

module.exports = router;
