const Booking = require('../models/Booking');
const Turf = require('../models/Turf');
const User = require('../models/User');

class RecommendationEngine {
    // Recommend turfs based on user's booking history
    async recommendTurfs(userId) {
        try {
            // Get user's past bookings
            const userBookings = await Booking.find({ user: userId }).sort({ date: -1 }).limit(10);
            
            // Extract most frequent sports and preferred times
            const sportFrequency = {};
            const timeSlotFrequency = {};

            userBookings.forEach(booking => {
                sportFrequency[booking.sport] = (sportFrequency[booking.sport] || 0) + 1;
                
                const hour = new Date(booking.startTime).getHours();
                const timeSlot = this.categorizeTimeSlot(hour);
                timeSlotFrequency[timeSlot] = (timeSlotFrequency[timeSlot] || 0) + 1;
            });

            // Find most preferred sport and time slot
            const preferredSport = Object.keys(sportFrequency).reduce(
                (a, b) => sportFrequency[a] > sportFrequency[b] ? a : b
            );
            const preferredTimeSlot = Object.keys(timeSlotFrequency).reduce(
                (a, b) => timeSlotFrequency[a] > timeSlotFrequency[b] ? a : b
            );

            // Find turfs matching preferences
            const recommendations = await Turf.find({
                sports: { $in: [preferredSport] },
                availableTimeSlots: { $in: [preferredTimeSlot] }
            }).limit(5);

            return {
                recommendations,
                preferredSport,
                preferredTimeSlot
            };
        } catch (error) {
            console.error('Recommendation error:', error);
            return null;
        }
    }

    // Categorize time slots
    categorizeTimeSlot(hour) {
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 16) return 'afternoon';
        if (hour >= 16 && hour < 20) return 'evening';
        return 'night';
    }

    // Dynamic pricing recommendations
    async calculateDynamicPricing(turf, booking) {
        try {
            // Base factors for dynamic pricing
            const factors = {
                dayOfWeek: this.getDayFactor(booking.date),
                timeSlot: this.getTimeFactor(booking.startTime),
                seasonality: this.getSeasonalityFactor(booking.date),
                demand: await this.getDemandFactor(turf, booking)
            };

            // Calculate final price multiplier
            const multiplier = Object.values(factors).reduce((a, b) => a * b, 1);
            
            return {
                originalPrice: turf.hourlyPrice,
                dynamicPrice: Math.round(turf.hourlyPrice * multiplier),
                pricingFactors: factors
            };
        } catch (error) {
            console.error('Dynamic pricing error:', error);
            return { originalPrice: turf.hourlyPrice };
        }
    }

    // Pricing factor for day of week
    getDayFactor(date) {
        const day = new Date(date).getDay();
        // Weekend premium
        return [0, 6].includes(day) ? 1.2 : 1;
    }

    // Pricing factor for time slot
    getTimeFactor(startTime) {
        const hour = new Date(startTime).getHours();
        // Peak hours premium
        return (hour >= 17 && hour <= 21) ? 1.3 : 1;
    }

    // Seasonal pricing factor
    getSeasonalityFactor(date) {
        const month = new Date(date).getMonth();
        // Summer and holiday seasons
        return [5, 6, 7, 11, 12].includes(month) ? 1.15 : 1;
    }

    // Demand-based pricing factor
    async getDemandFactor(turf, booking) {
        const bookingsInSameSlot = await Booking.countDocuments({
            turf: turf._id,
            date: booking.date,
            $or: [
                { startTime: { $lt: booking.endTime, $gte: booking.startTime } },
                { endTime: { $gt: booking.startTime, $lte: booking.endTime } }
            ]
        });

        // Higher demand increases price
        return 1 + (bookingsInSameSlot * 0.05);
    }
}

module.exports = new RecommendationEngine();
