const mongoose = require('mongoose');

const recurringBookingSchema = new mongoose.Schema({
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
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    recurringPattern: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'custom'],
        default: 'weekly'
    },
    daysOfWeek: [{
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
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
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'completed', 'cancelled'],
        default: 'active'
    },
    bookings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    }],
    groupDiscount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total booking duration
recurringBookingSchema.virtual('duration').get(function() {
    const [startHour, startMinute] = this.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.endTime.split(':').map(Number);
    return endHour - startHour + (endMinute - startMinute) / 60;
});

// Method to generate individual bookings
recurringBookingSchema.methods.generateBookings = async function() {
    const bookings = [];
    let currentDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);

    while (currentDate <= endDate) {
        // Check if current day matches recurring pattern
        if (this.daysOfWeek.includes(currentDate.toLocaleString('en-US', { weekday: 'long' }))) {
            const booking = new mongoose.models.Booking({
                user: this.user,
                turf: this.turf,
                sport: this.sport,
                date: currentDate,
                startTime: this.startTime,
                endTime: this.endTime,
                totalPrice: this.calculateDynamicPrice(currentDate),
                status: 'pending',
                recurringBooking: this._id
            });

            bookings.push(booking);
            this.bookings.push(booking._id);
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return bookings;
};

// Dynamic pricing method
recurringBookingSchema.methods.calculateDynamicPrice = function(date) {
    const basePrice = this.totalPrice;
    const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' });
    const hour = date.getHours();

    // Peak hour pricing (20% increase)
    const isPeakHour = (hour >= 17 && hour <= 21);
    const peakMultiplier = isPeakHour ? 1.2 : 1;

    // Weekend pricing (10% increase)
    const isWeekend = ['Saturday', 'Sunday'].includes(dayOfWeek);
    const weekendMultiplier = isWeekend ? 1.1 : 1;

    return Math.round(basePrice * peakMultiplier * weekendMultiplier);
};

const RecurringBooking = mongoose.model('RecurringBooking', recurringBookingSchema);

module.exports = RecurringBooking;
