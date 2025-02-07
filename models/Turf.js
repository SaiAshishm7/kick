// models/Turf.js

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true }
}, { timestamps: true });

const turfSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    hourlyPrice: { type: Number, required: true },
    availableSports: [{ type: String }],  // E.g., cricket, football
    reviews: [reviewSchema],
}, { timestamps: true });

const Turf = mongoose.model('Turf', turfSchema);

module.exports = Turf;
