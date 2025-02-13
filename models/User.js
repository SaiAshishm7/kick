const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Don't include password in query results by default
    },
    profilePicture: {
        type: String,
        default: 'default-profile.png'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    phoneNumber: {
        type: String,
        validate: {
            validator: function(v) {
                return !v || validator.isMobilePhone(v);
            },
            message: 'Please provide a valid phone number'
        }
    },
    address: {
        type: String,
        trim: true
    },
    notifications: [notificationSchema],
    bookingCount: {
        type: Number,
        default: 0,
        min: [0, 'Booking count cannot be negative']
    },
    lastLogin: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    preferences: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        smsNotifications: {
            type: Boolean,
            default: false
        },
        language: {
            type: String,
            default: 'en',
            enum: ['en', 'hi', 'te'] // English, Hindi, Telugu
        },
        favoriteSports: [{
            type: String,
            enum: ['football', 'cricket', 'basketball', 'tennis', 'volleyball']
        }],
        preferredTimeSlots: [{
            type: String,
            enum: ['morning', 'afternoon', 'evening', 'night']
        }]
    },
    profile: {
        firstName: {
            type: String,
            trim: true
        },
        lastName: {
            type: String,
            trim: true
        },
        profileImage: {
            type: String,
            default: 'default-profile.png'
        },
        bio: {
            type: String,
            maxlength: 500
        },
        phone: {
            type: String,
            trim: true,
            match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Please fill a valid phone number']
        },
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String
        }
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    accountStatus: {
        type: String,
        enum: ['active', 'suspended', 'deleted'],
        default: 'active'
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    loyaltyPoints: {
        type: Number,
        default: 0,
        min: 0
    },
    loyaltyTier: {
        type: String,
        enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
        default: 'Bronze'
    },
    totalBookings: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.profile.firstName || ''} ${this.profile.lastName || ''}`.trim();
});

// Virtual for booking history
userSchema.virtual('bookingHistory', {
    ref: 'Booking',
    localField: '_id',
    foreignField: 'user',
    options: { 
        sort: { date: -1 },
        limit: 50
    }
});

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ isAdmin: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        // Generate salt
        const salt = await bcrypt.genSalt(10);
        // Hash password
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error(error);
    }
};

// Method to safely return user data without sensitive information
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;
    return user;
};

// Method to get profile details with booking history
userSchema.methods.getProfileWithBookings = async function() {
    await this.populate({
        path: 'bookingHistory',
        populate: {
            path: 'turf',
            select: 'name location'
        },
        options: { 
            sort: { date: -1 },
            limit: 50
        }
    });

    return {
        profile: {
            username: this.name,
            email: this.email,
            fullName: this.fullName,
            profileImage: this.profile.profileImage,
            bio: this.profile.bio,
            phone: this.profile.phone,
            preferences: this.preferences
        },
        bookings: this.bookingHistory
    };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
