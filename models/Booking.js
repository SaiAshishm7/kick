const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    turf: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf', required: true },
    sport: { type: String, required: true }, // Football, Cricket, etc.
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    startTime: { type: String, required: true }, // Format: HH:MM
    endTime: { type: String, required: true }, // Format: HH:MM
    totalCost: { type: Number, required: true },
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
