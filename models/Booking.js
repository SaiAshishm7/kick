// // models/Booking.js

// const mongoose = require('mongoose');

// const bookingSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     turfId: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf', required: true },
//     date: { type: Date, required: true },
//     startTime: { type: String, required: true },
//     endTime: { type: String, required: true },
//     status: { type: String, enum: ['Booked', 'Cancelled', 'Completed'], default: 'Booked' }
// }, { timestamps: true });

// module.exports = mongoose.model('Booking', bookingSchema);

// models/Booking.js

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  turfId: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['Booked', 'Cancelled', 'Completed'], default: 'Booked' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);


// Check for overlapping bookings before saving
bookingSchema.pre('save', async function (next) {
    const existingBookings = await mongoose.model('Booking').find({
        turfId: this.turfId,
        date: this.date,
        $or: [
            { startTime: { $lt: this.endTime, $gte: this.startTime } },
            { endTime: { $gt: this.startTime, $lte: this.endTime } },
            { startTime: { $lte: this.startTime }, endTime: { $gte: this.endTime } }
        ]
    });

    if (existingBookings.length > 0) {
        const err = new Error('This time slot is already booked.');
        return next(err);
    }

    next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
