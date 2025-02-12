// routes/reviewRoutes.js

const express = require('express');
const router = express.Router();
const Turf = require('../models/Turf');
const Booking = require('../models/Booking');

// Add a Review
router.post('/:turfId/review', async (req, res) => {
    try {
        const { userId, userName, rating, comment, bookingId } = req.body;

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Find the turf
        const turf = await Turf.findById(req.params.turfId);
        if (!turf) {
            return res.status(404).json({ message: 'Turf not found' });
        }

        // Verify the booking exists and is completed
        if (bookingId) {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            if (booking.status !== 'Completed') {
                return res.status(400).json({ message: 'Can only review completed bookings' });
            }
            if (booking.userId.toString() !== userId) {
                return res.status(403).json({ message: 'Not authorized to review this booking' });
            }
        }

        // Check if user has already reviewed this booking
        if (bookingId && turf.reviews.some(review => review.bookingId?.toString() === bookingId)) {
            return res.status(400).json({ message: 'You have already reviewed this booking' });
        }

        // Add the review
        turf.reviews.push({
            userId,
            userName,
            rating,
            comment,
            bookingId
        });

        await turf.save();

        res.status(201).json({
            message: 'Review added successfully',
            review: turf.reviews[turf.reviews.length - 1],
            averageRating: turf.averageRating,
            totalReviews: turf.totalReviews
        });
    } catch (err) {
        console.error('Error adding review:', err);
        res.status(500).json({ message: 'Error adding review' });
    }
});

// Get All Reviews for a Turf
router.get('/:turfId/reviews', async (req, res) => {
    try {
        const turf = await Turf.findById(req.params.turfId)
            .populate('reviews.userId', 'name');

        if (!turf) {
            return res.status(404).json({ message: 'Turf not found' });
        }

        // Sort reviews by date (newest first)
        const sortedReviews = turf.reviews.sort((a, b) => b.createdAt - a.createdAt);

        res.status(200).json({
            reviews: sortedReviews,
            averageRating: turf.averageRating,
            totalReviews: turf.totalReviews
        });
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ message: 'Error fetching reviews' });
    }
});

// Delete a Review (Admin or Review Owner)
router.delete('/:turfId/review/:reviewId', async (req, res) => {
    try {
        console.log('Delete request for review:', req.params.reviewId);
        const turf = await Turf.findById(req.params.turfId);

        if (!turf) {
            console.log('Turf not found');
            return res.status(404).json({ message: 'Turf not found' });
        }

        // Find the review index
        const reviewIndex = turf.reviews.findIndex(review => 
            review._id.toString() === req.params.reviewId
        );

        if (reviewIndex === -1) {
            console.log('Review not found');
            return res.status(404).json({ message: 'Review not found' });
        }

        // Remove the review using splice
        turf.reviews.splice(reviewIndex, 1);
        console.log('Review removed from array');

        // Save the updated turf
        const updatedTurf = await turf.save();
        console.log('Turf saved with updated reviews');

        res.status(200).json({
            message: 'Review deleted successfully',
            reviews: updatedTurf.reviews,
            averageRating: updatedTurf.averageRating,
            totalReviews: updatedTurf.totalReviews
        });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).json({ message: 'Error deleting review' });
    }
});

module.exports = router;

module.exports = router;
