const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    turf: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Turf', 
        required: true 
    },
    sport: {
        type: String,
        required: true,
        enum: ['football', 'cricket', 'basketball']
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true,
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    endTime: {
        type: String,
        required: true,
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    status: {
        type: String,
        enum: ['pending', 'allocated', 'cancelled'],
        default: 'pending'
    },
    priority: {
        type: Number,
        default: 0,
        min: 0
    },
    allocatedBooking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Method to auto-allocate slot if available
waitlistSchema.methods.checkAndAllocate = async function() {
    const existingBookings = await mongoose.models.Booking.find({
        turf: this.turf,
        date: this.date,
        $or: [
            { startTime: { $lt: this.endTime, $gte: this.startTime } },
            { endTime: { $gt: this.startTime, $lte: this.endTime } },
            { startTime: { $lte: this.startTime }, endTime: { $gte: this.endTime } }
        ]
    });

    if (existingBookings.length === 0) {
        // Slot is available, create a booking
        const booking = new mongoose.models.Booking({
            user: this.user,
            turf: this.turf,
            sport: this.sport,
            date: this.date,
            startTime: this.startTime,
            endTime: this.endTime,
            totalPrice: await this.calculatePrice(),
            status: 'confirmed',
            waitlist: this._id
        });

        await booking.save();

        // Update waitlist
        this.status = 'allocated';
        this.allocatedBooking = booking._id;
        await this.save();

        return booking;
    }

    return null;
};

// Method to calculate dynamic price
waitlistSchema.methods.calculatePrice = async function() {
    const turf = await mongoose.models.Turf.findById(this.turf);
    const basePrice = turf.hourlyPrice;
    const date = new Date(this.date);
    const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' });
    const hour = parseInt(this.startTime.split(':')[0]);

    // Peak hour pricing (20% increase)
    const isPeakHour = (hour >= 17 && hour <= 21);
    const peakMultiplier = isPeakHour ? 1.2 : 1;

    // Weekend pricing (10% increase)
    const isWeekend = ['Saturday', 'Sunday'].includes(dayOfWeek);
    const weekendMultiplier = isWeekend ? 1.1 : 1;

    // Priority discount/increase
    const priorityMultiplier = 1 + (this.priority * 0.05);

    return Math.round(basePrice * peakMultiplier * weekendMultiplier * priorityMultiplier);
};

const Waitlist = mongoose.model('Waitlist', waitlistSchema);

module.exports = Waitlist;
