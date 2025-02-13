const express = require('express');
const router = express.Router();
const Turf = require('../models/Turf');
const Booking = require('../models/Booking');

// Advanced search endpoint with availability checking
router.get('/turfs', async (req, res) => {
    try {
        const {
            search,
            location,
            date,
            timeSlot,
            minPrice,
            maxPrice,
            rating,
            amenities,
            sort
        } = req.query;

        // Build the search query
        const query = {};

        // Text search for name and description
        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') }
            ];
        }

        // Location search
        if (location) {
            query.location = new RegExp(location, 'i');
        }

        // Price range
        if (minPrice || maxPrice) {
            query.pricePerHour = {};
            if (minPrice) query.pricePerHour.$gte = Number(minPrice);
            if (maxPrice) query.pricePerHour.$lte = Number(maxPrice);
        }

        // Rating filter
        if (rating) {
            query.averageRating = { $gte: Number(rating) };
        }

        // Amenities filter
        if (amenities) {
            const amenitiesList = amenities.split(',');
            query.amenities = { $all: amenitiesList };
        }

        // Build sort options
        let sortOptions = {};
        if (sort) {
            const [field, order] = sort.split(':');
            sortOptions[field] = order === 'desc' ? -1 : 1;
        } else {
            // Default sort by rating
            sortOptions = { averageRating: -1 };
        }

        // First get all turfs matching the basic criteria
        let turfs = await Turf.find(query).sort(sortOptions);

        // If date and timeSlot are provided, check availability
        if (date && timeSlot) {
            const searchDate = new Date(date);
            
            // Get all bookings for the specified date and time slot
            const bookings = await Booking.find({
                turfId: { $in: turfs.map(t => t._id) },
                bookingDate: {
                    $gte: new Date(searchDate.setHours(0, 0, 0)),
                    $lt: new Date(searchDate.setHours(23, 59, 59))
                },
                timeSlot: timeSlot,
                status: { $in: ['confirmed', 'pending'] }
            });

            // Filter out turfs that are already booked
            const bookedTurfIds = bookings.map(b => b.turfId.toString());
            turfs = turfs.filter(turf => !bookedTurfIds.includes(turf._id.toString()));
        }

        // Add distance if coordinates are provided
        if (req.query.lat && req.query.lng) {
            const userLat = parseFloat(req.query.lat);
            const userLng = parseFloat(req.query.lng);

            turfs = turfs.map(turf => {
                const turfObj = turf.toObject();
                if (turf.location && turf.location.coordinates) {
                    const distance = calculateDistance(
                        userLat,
                        userLng,
                        turf.location.coordinates[1],
                        turf.location.coordinates[0]
                    );
                    return { ...turfObj, distance };
                }
                return turfObj;
            });

            // Sort by distance if requested
            if (sort === 'distance:asc') {
                turfs.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
            }
        }

        res.json(turfs);
    } catch (error) {
        res.status(500).json({ message: 'Error searching turfs', error: error.message });
    }
});

// Get available time slots for a specific turf and date
router.get('/availability/:turfId', async (req, res) => {
    try {
        const { turfId } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        const searchDate = new Date(date);
        
        // Get all bookings for the specified date
        const bookings = await Booking.find({
            turfId,
            bookingDate: {
                $gte: new Date(searchDate.setHours(0, 0, 0)),
                $lt: new Date(searchDate.setHours(23, 59, 59))
            },
            status: { $in: ['confirmed', 'pending'] }
        });

        // Get the turf's operating hours
        const turf = await Turf.findById(turfId);
        if (!turf) {
            return res.status(404).json({ message: 'Turf not found' });
        }

        // Generate all possible time slots
        const allTimeSlots = generateTimeSlots(turf.operatingHours);
        
        // Mark slots as available or booked
        const availability = allTimeSlots.map(slot => ({
            timeSlot: slot,
            isAvailable: !bookings.some(booking => booking.timeSlot === slot)
        }));

        res.json(availability);
    } catch (error) {
        res.status(500).json({ message: 'Error checking availability', error: error.message });
    }
});

// Get recommended turfs based on user preferences and booking history
router.get('/recommendations', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Get user's booking history
        const userBookings = await Booking.find({ userId })
            .populate('turfId')
            .sort({ bookingDate: -1 });

        // Extract user preferences
        const preferredLocations = new Set(userBookings.map(b => b.turfId.location));
        const preferredAmenities = new Set(
            userBookings.flatMap(b => b.turfId.amenities)
        );
        const averagePrice = userBookings.reduce((acc, b) => acc + b.totalAmount, 0) / userBookings.length;

        // Find similar turfs
        const recommendations = await Turf.find({
            $or: [
                { location: { $in: Array.from(preferredLocations) } },
                { amenities: { $in: Array.from(preferredAmenities) } },
                { pricePerHour: { $gte: averagePrice * 0.8, $lte: averagePrice * 1.2 } }
            ],
            _id: { $nin: userBookings.map(b => b.turfId._id) } // Exclude already booked turfs
        })
        .sort({ averageRating: -1 })
        .limit(5);

        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ message: 'Error getting recommendations', error: error.message });
    }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Helper function to generate time slots
function generateTimeSlots(operatingHours) {
    const slots = [];
    const start = parseInt(operatingHours.start.split(':')[0]);
    const end = parseInt(operatingHours.end.split(':')[0]);

    for (let hour = start; hour < end; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }

    return slots;
}

module.exports = router;
