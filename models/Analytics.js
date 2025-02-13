const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    // Booking Analytics
    bookingStats: {
        totalBookings: { type: Number, default: 0 },
        cancelledBookings: { type: Number, default: 0 },
        completedBookings: { type: Number, default: 0 },
        averageBookingDuration: { type: Number, default: 0 }
    },
    
    // Revenue Analytics
    revenueStats: {
        totalRevenue: { type: Number, default: 0 },
        monthlyRevenue: [{
            month: { type: String },
            year: { type: Number },
            amount: { type: Number, default: 0 }
        }],
        sportRevenue: [{
            sport: { type: String },
            revenue: { type: Number, default: 0 }
        }]
    },
    
    // Usage Analytics
    usageStats: {
        peakHours: [{
            hour: { type: String },
            bookingCount: { type: Number, default: 0 }
        }],
        sportPopularity: [{
            sport: { type: String },
            bookingCount: { type: Number, default: 0 }
        }],
        dayOfWeekUsage: [{
            day: { type: String },
            bookingCount: { type: Number, default: 0 }
        }]
    },
    
    // User Behavior
    userBehavior: {
        averageBookingsPerUser: { type: Number, default: 0 },
        repeatUserPercentage: { type: Number, default: 0 },
        averageBookingValue: { type: Number, default: 0 }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Method to update booking statistics
analyticsSchema.methods.updateBookingStats = async function(booking) {
    // Increment total bookings
    this.bookingStats.totalBookings++;

    // Update booking status counts
    if (booking.status === 'cancelled') {
        this.bookingStats.cancelledBookings++;
    } else if (booking.status === 'completed') {
        this.bookingStats.completedBookings++;
    }

    // Calculate average booking duration
    const duration = (new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60 * 60);
    this.bookingStats.averageBookingDuration = 
        (this.bookingStats.averageBookingDuration + duration) / this.bookingStats.totalBookings;

    return this;
};

// Method to update revenue statistics
analyticsSchema.methods.updateRevenueStats = async function(booking) {
    // Total revenue
    this.revenueStats.totalRevenue += booking.totalPrice;

    // Monthly revenue
    const bookingDate = new Date(booking.date);
    const monthKey = `${bookingDate.getFullYear()}-${bookingDate.getMonth() + 1}`;
    const monthlyRevenueIndex = this.revenueStats.monthlyRevenue.findIndex(
        m => m.month === monthKey
    );

    if (monthlyRevenueIndex !== -1) {
        this.revenueStats.monthlyRevenue[monthlyRevenueIndex].amount += booking.totalPrice;
    } else {
        this.revenueStats.monthlyRevenue.push({
            month: monthKey,
            year: bookingDate.getFullYear(),
            amount: booking.totalPrice
        });
    }

    // Sport-specific revenue
    const sportRevenueIndex = this.revenueStats.sportRevenue.findIndex(
        s => s.sport === booking.sport
    );

    if (sportRevenueIndex !== -1) {
        this.revenueStats.sportRevenue[sportRevenueIndex].revenue += booking.totalPrice;
    } else {
        this.revenueStats.sportRevenue.push({
            sport: booking.sport,
            revenue: booking.totalPrice
        });
    }

    return this;
};

// Method to update usage statistics
analyticsSchema.methods.updateUsageStats = async function(booking) {
    // Peak hours
    const bookingHour = new Date(booking.startTime).getHours();
    const peakHourIndex = this.usageStats.peakHours.findIndex(
        ph => ph.hour === `${bookingHour}:00`
    );

    if (peakHourIndex !== -1) {
        this.usageStats.peakHours[peakHourIndex].bookingCount++;
    } else {
        this.usageStats.peakHours.push({
            hour: `${bookingHour}:00`,
            bookingCount: 1
        });
    }

    // Sport popularity
    const sportPopIndex = this.usageStats.sportPopularity.findIndex(
        sp => sp.sport === booking.sport
    );

    if (sportPopIndex !== -1) {
        this.usageStats.sportPopularity[sportPopIndex].bookingCount++;
    } else {
        this.usageStats.sportPopularity.push({
            sport: booking.sport,
            bookingCount: 1
        });
    }

    // Day of week usage
    const dayOfWeek = new Date(booking.date).toLocaleString('en-US', { weekday: 'long' });
    const dayUsageIndex = this.usageStats.dayOfWeekUsage.findIndex(
        du => du.day === dayOfWeek
    );

    if (dayUsageIndex !== -1) {
        this.usageStats.dayOfWeekUsage[dayUsageIndex].bookingCount++;
    } else {
        this.usageStats.dayOfWeekUsage.push({
            day: dayOfWeek,
            bookingCount: 1
        });
    }

    return this;
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;
