// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'User is required']
    },
    turf: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Turf', 
        required: [true, 'Turf is required']
    },
    sport: {
        type: String,
        required: [true, 'Sport is required'],
        enum: {
            values: ['football', 'cricket', 'basketball', 'tennis', 'volleyball', 'badminton'],
            message: '{VALUE} is not a supported sport'
        },
        set: v => v.toLowerCase(), // Convert to lowercase before saving
        validate: {
            validator: function(v) {
                return ['football', 'cricket', 'basketball', 'tennis', 'volleyball', 'badminton']
                    .includes(v.toLowerCase());
            },
            message: props => `${props.value} is not a valid sport!`
        }
    },
    date: { 
        type: Date, 
        required: [true, 'Date is required'],
        validate: {
            validator: function(value) {
                return value >= new Date().setHours(0, 0, 0, 0);
            },
            message: 'Booking date cannot be in the past'
        }
    },
    startTime: { 
        type: String, 
        required: [true, 'Start time is required'],
        validate: {
            validator: function(v) {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Start time must be in HH:mm format'
        }
    },
    endTime: { 
        type: String, 
        required: [true, 'End time is required'],
        validate: {
            validator: function(v) {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'End time must be in HH:mm format'
        }
    },
    totalPrice: { 
        type: Number, 
        required: [true, 'Total price is required'],
        min: [0, 'Price cannot be negative']
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'failed'],
        default: 'pending'
    },
    cancellationReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
    },
    refundAmount: {
        type: Number,
        default: 0,
        min: [0, 'Refund amount cannot be negative']
    },
    cancellationFee: {
        type: Number,
        default: 0,
        min: [0, 'Cancellation fee cannot be negative']
    },
    notes: {
        type: String,
        maxLength: [500, 'Notes cannot exceed 500 characters']
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for booking duration
bookingSchema.virtual('duration').get(function() {
    const [startHour, startMinute] = this.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.endTime.split(':').map(Number);
    return endHour - startHour + (endMinute - startMinute) / 60;
});

// Pre-save hook to validate time
bookingSchema.pre('save', function(next) {
    // Ensure start time is before end time
    const [startHour, startMinute] = this.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.endTime.split(':').map(Number);

    if (startHour > endHour || (startHour === endHour && startMinute >= endMinute)) {
        return next(new Error('Start time must be before end time'));
    }

    next();
});

// Method to calculate refund
bookingSchema.methods.calculateRefund = function(cancellationTime) {
    const bookingStart = new Date(this.date);
    const [hours, minutes] = this.startTime.split(':').map(Number);
    bookingStart.setHours(hours, minutes, 0, 0);

    const timeDiff = bookingStart.getTime() - cancellationTime.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (hoursDiff > 48) {
        refundPercentage = 1; // 100% refund if cancelled more than 48 hours before
    } else if (hoursDiff > 24) {
        refundPercentage = 0.75; // 75% refund if cancelled 24-48 hours before
    } else if (hoursDiff > 12) {
        refundPercentage = 0.5; // 50% refund if cancelled 12-24 hours before
    }

    const refundAmount = Math.round(this.totalPrice * refundPercentage);
    const cancellationFee = this.totalPrice - refundAmount;

    return {
        refundAmount,
        cancellationFee,
        refundPercentage
    };
};

// Check for overlapping bookings before saving
bookingSchema.pre('save', async function(next) {
    if (this.isModified('date') || this.isModified('startTime') || this.isModified('endTime')) {
        const existingBooking = await this.constructor.findOne({
            turf: this.turf,
            date: this.date,
            status: { $nin: ['cancelled'] },
            _id: { $ne: this._id },
            $or: [
                { startTime: { $lt: this.endTime }, endTime: { $gt: this.startTime } },
                { startTime: { $gte: this.startTime, $lt: this.endTime } }
            ]
        });

        if (existingBooking) {
            const err = new Error('Time slot is already booked');
            err.status = 400;
            return next(err);
        }
    }
    next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
