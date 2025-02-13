const mongoose = require('mongoose');

const loyaltySchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true
    },
    points: {
        type: Number,
        default: 0,
        min: 0
    },
    totalSpend: {
        type: Number,
        default: 0,
        min: 0
    },
    tier: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum'],
        default: 'bronze'
    },
    bookingHistory: [{
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking'
        },
        pointsEarned: Number,
        date: Date
    }],
    referralCode: {
        type: String,
        unique: true
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for next tier progress
loyaltySchema.virtual('tierProgress').get(function() {
    const tierThresholds = {
        bronze: { min: 0, max: 5000 },
        silver: { min: 5000, max: 15000 },
        gold: { min: 15000, max: 50000 },
        platinum: { min: 50000, max: Infinity }
    };

    const currentTier = this.tier;
    const currentSpend = this.totalSpend;
    const currentThreshold = tierThresholds[currentTier];
    const nextTier = Object.keys(tierThresholds)[
        Object.keys(tierThresholds).indexOf(currentTier) + 1
    ] || currentTier;

    const nextThreshold = tierThresholds[nextTier];
    const progressPercentage = nextTier === currentTier 
        ? 100 
        : Math.min(100, ((currentSpend - currentThreshold.min) / (nextThreshold.min - currentThreshold.min)) * 100);

    return {
        currentTier,
        nextTier,
        currentSpend,
        progressPercentage
    };
});

// Method to calculate points earned
loyaltySchema.methods.calculatePointsFromBooking = function(booking) {
    const basePointRate = 10; // 10 points per ₹100
    const pointsEarned = Math.floor(booking.totalPrice / 100 * basePointRate);

    // Tier multipliers
    const tierMultipliers = {
        bronze: 1,
        silver: 1.2,
        gold: 1.5,
        platinum: 2
    };

    const multiplier = tierMultipliers[this.tier] || 1;
    return Math.round(pointsEarned * multiplier);
};

// Method to update loyalty status
loyaltySchema.methods.updateLoyaltyStatus = function(booking) {
    // Update total spend
    this.totalSpend += booking.totalPrice;

    // Calculate and add points
    const pointsEarned = this.calculatePointsFromBooking(booking);
    this.points += pointsEarned;

    // Update tier
    const tierThresholds = {
        bronze: 5000,
        silver: 15000,
        gold: 50000,
        platinum: 100000
    };

    const newTier = Object.keys(tierThresholds).reverse().find(
        tier => this.totalSpend >= tierThresholds[tier]
    ) || 'bronze';

    this.tier = newTier;

    // Add to booking history
    this.bookingHistory.push({
        booking: booking._id,
        pointsEarned,
        date: new Date()
    });

    return {
        pointsEarned,
        newTier,
        totalPoints: this.points
    };
};

// Generate referral code
loyaltySchema.pre('save', function(next) {
    if (!this.referralCode) {
        this.referralCode = `KNC-${this.user.toString().slice(-6).toUpperCase()}`;
    }
    next();
});

const Loyalty = mongoose.model('Loyalty', loyaltySchema);

module.exports = Loyalty;
