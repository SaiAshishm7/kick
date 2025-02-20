// models/Turf.js

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }
}, { timestamps: true });

const turfSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    hourlyPrice: { type: Number, required: true },
    sports: {
        type: [String],
        enum: ['football', 'cricket', 'basketball', 'tennis', 'volleyball', 'badminton'],
        required: true,
        set: v => v.map(sport => sport.toLowerCase()),
        validate: {
            validator: function(v) {
                return v.every(sport => 
                    ['football', 'cricket', 'basketball', 'tennis', 'volleyball', 'badminton']
                        .includes(sport.toLowerCase())
                );
            },
            message: props => `Some sports are not supported: ${props.value}`
        }
    },
    images: [{ type: String }], // URLs to turf images
    amenities: [{ type: String }], // e.g., ['Parking', 'Changing Rooms', 'Water']
    description: { type: String },
    reviews: [reviewSchema],
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
}, { timestamps: true });

// Calculate average rating before saving
turfSchema.pre('save', function(next) {
    if (this.reviews.length > 0) {
        const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
        this.averageRating = (totalRating / this.reviews.length).toFixed(1);
        this.totalReviews = this.reviews.length;
    }
    next();
});

// Log model creation details
console.log('Turf Model Creation:', {
    schemaName: 'turfSchema',
    modelName: 'Turf',
    collectionName: 'turfs'
});

const Turf = mongoose.model('Turf', turfSchema, 'turfs');

// Verify model creation
console.log('Turf Model Created:', {
    modelName: Turf.modelName,
    collectionName: Turf.collection.name
});

module.exports = Turf;
