// routes/reviewRoutes.js

const express = require('express');
const router = express.Router();
const Turf = require('../models/Turf');

// Add a Review
router.post('/:turfId/review', async (req, res) => {
    try {
        const { user, rating, comment } = req.body;
        const turf = await Turf.findById(req.params.turfId);

        if (!turf) return res.status(404).json({ message: 'Turf not found' });

        turf.reviews.push({ user, rating, comment });
        await turf.save();

        res.status(201).json({ message: 'Review added successfully', reviews: turf.reviews });
    } catch (err) {
        res.status(400).json({ message: 'Error adding review', error: err });
    }
});

// Get All Reviews for a Turf
router.get('/:turfId/reviews', async (req, res) => {
    try {
        const turf = await Turf.findById(req.params.turfId);

        if (!turf) return res.status(404).json({ message: 'Turf not found' });

        res.status(200).json(turf.reviews);
    } catch (err) {
        res.status(400).json({ message: 'Error fetching reviews', error: err });
    }
});

// Delete a Review (Admin)
router.delete('/:turfId/review/:reviewId', async (req, res) => {
    try {
        const turf = await Turf.findById(req.params.turfId);

        if (!turf) return res.status(404).json({ message: 'Turf not found' });

        turf.reviews = turf.reviews.filter(review => review._id.toString() !== req.params.reviewId);
        await turf.save();

        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: 'Error deleting review', error: err });
    }
});

module.exports = router;
