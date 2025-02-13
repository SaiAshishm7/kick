const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const Booking = require('../models/Booking');
const Turf = require('../models/Turf');
const User = require('../models/User');
const Review = require('../models/Review');

// Logging middleware for admin routes
router.use((req, res, next) => {
    console.log('ADMIN ROUTE ACCESS:', {
        path: req.path,
        method: req.method,
        headers: {
            authorization: req.headers.authorization ? 'Present' : 'Missing'
        },
        timestamp: new Date().toISOString()
    });
    next();
});

// Apply admin middleware to all routes
router.use(adminMiddleware);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        console.log('ADMIN STATS REQUEST:', {
            admin: req.admin ? req.admin.email : 'No admin in request',
            timestamp: new Date().toISOString()
        });

        const [totalBookings, totalUsers, totalTurfs, totalRevenue] = await Promise.all([
            Booking.countDocuments(),
            User.countDocuments(),
            Turf.countDocuments(),
            Booking.aggregate([
                { $match: { status: 'Completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ])
        ]);

        const stats = {
            totalBookings,
            totalUsers,
            totalTurfs,
            revenue: totalRevenue[0]?.total || 0
        };

        console.log('ADMIN STATS RESPONSE:', stats);

        res.status(200).json(stats);
    } catch (err) {
        console.error('ADMIN STATS ERROR:', {
            message: err.message,
            stack: err.stack
        });
        res.status(500).json({ 
            message: 'Error fetching statistics', 
            error: err.message 
        });
    }
});

// Get all bookings with filters
router.get('/bookings', async (req, res) => {
    try {
        console.log('ADMIN BOOKINGS REQUEST:', {
            query: req.query,
            admin: req.admin ? req.admin.email : 'No admin in request'
        });

        const { status, date, user, turfId } = req.query;
        const query = {};

        if (status) query.status = status;
        if (date) query.date = new Date(date);
        if (user) query.user = user;
        if (turfId) query.turf = turfId;  

        const bookings = await Booking.find(query)
            .populate('user', 'name email')
            .populate('turf', 'name location')  
            .sort({ createdAt: -1 });

        console.log('ADMIN BOOKINGS RESPONSE:', {
            count: bookings.length,
            bookings: bookings.map(booking => ({
                id: booking._id,
                userName: booking.user?.name,
                turfName: booking.turf?.name,
                date: booking.date,
                status: booking.status
            }))
        });

        res.status(200).json(bookings);
    } catch (err) {
        console.error('ADMIN BOOKINGS ERROR:', {
            message: err.message,
            stack: err.stack
        });
        res.status(500).json({ 
            message: 'Error fetching bookings', 
            error: err.message 
        });
    }
});

// 2. Update booking status (Modify/Cancel)
router.put('/bookings/:id', async (req, res) => {
    try {
        console.log('ADMIN BOOKINGS UPDATE REQUEST:', {
            id: req.params.id,
            body: req.body,
            admin: req.admin ? req.admin.email : 'No admin in request'
        });

        const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });

        console.log('ADMIN BOOKINGS UPDATE RESPONSE:', {
            updatedBooking
        });

        res.status(200).json({ message: 'Booking updated successfully', updatedBooking });
    } catch (err) {
        console.error('ADMIN BOOKINGS UPDATE ERROR:', {
            message: err.message,
            stack: err.stack
        });
        res.status(400).json({ message: 'Error updating booking', error: err });
    }
});

// 3. Delete a booking
router.delete('/bookings/:id', async (req, res) => {
    try {
        console.log('ADMIN BOOKINGS DELETE REQUEST:', {
            id: req.params.id,
            admin: req.admin ? req.admin.email : 'No admin in request'
        });

        await Booking.findByIdAndDelete(req.params.id);

        console.log('ADMIN BOOKINGS DELETE RESPONSE:', {
            message: 'Booking deleted successfully'
        });

        res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (err) {
        console.error('ADMIN BOOKINGS DELETE ERROR:', {
            message: err.message,
            stack: err.stack
        });
        res.status(400).json({ message: 'Error deleting booking', error: err });
    }
});

// Get all users with search and filter
router.get('/users', async (req, res) => {
    try {
        console.log('ADMIN USERS REQUEST:', {
            query: req.query,
            admin: req.admin ? req.admin.email : 'No admin in request'
        });

        const { search, role, sort } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') }
            ];
        }

        if (role) query.role = role;

        const sortOptions = {};
        if (sort) {
            const [field, order] = sort.split(':');
            sortOptions[field] = order === 'desc' ? -1 : 1;
        } else {
            sortOptions.createdAt = -1;
        }

        const users = await User.find(query)
            .sort(sortOptions)
            .select('-password');  // Exclude password

        console.log('ADMIN USERS RESPONSE:', {
            count: users.length
        });

        res.status(200).json(users);
    } catch (err) {
        console.error('ADMIN USERS ERROR:', {
            message: err.message,
            stack: err.stack
        });
        res.status(500).json({ 
            message: 'Error fetching users', 
            error: err.message 
        });
    }
});

// 5. Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        console.log('ADMIN USERS DELETE REQUEST:', {
            id: req.params.id,
            admin: req.admin ? req.admin.email : 'No admin in request'
        });

        await User.findByIdAndDelete(req.params.id);

        console.log('ADMIN USERS DELETE RESPONSE:', {
            message: 'User deleted successfully'
        });

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('ADMIN USERS DELETE ERROR:', {
            message: err.message,
            stack: err.stack
        });
        res.status(400).json({ message: 'Error deleting user', error: err });
    }
});

// 6. Delete review
router.delete('/reviews/:id', async (req, res) => {
    try {
        console.log('ADMIN REVIEWS DELETE REQUEST:', {
            id: req.params.id,
            admin: req.admin ? req.admin.email : 'No admin in request'
        });

        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });

        console.log('ADMIN REVIEWS DELETE RESPONSE:', {
            message: 'Review deleted successfully'
        });

        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (err) {
        console.error('ADMIN REVIEWS DELETE ERROR:', {
            message: err.message,
            stack: err.stack
        });
        res.status(400).json({ message: 'Error deleting review', error: err });
    }
});

module.exports = router;
