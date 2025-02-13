const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const adminSchema = new mongoose.Schema({
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
        select: false
    },
    profilePicture: {
        type: String,
        default: 'default-admin.png'
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin'],
        default: 'admin'
    },
    permissions: {
        manageUsers: { type: Boolean, default: true },
        manageTurfs: { type: Boolean, default: true },
        manageBookings: { type: Boolean, default: true },
        viewAnalytics: { type: Boolean, default: true },
        manageAdmins: { type: Boolean, default: false }
    },
    lastLogin: { type: Date },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    passwordResetToken: String,
    passwordResetExpires: Date
}, {
    timestamps: true,  // Add createdAt and updatedAt fields
    collection: 'admins'  // Explicitly set collection name
});

// Indexes for performance
adminSchema.index({ email: 1 }, { unique: true });
adminSchema.index({ role: 1 });

// Method to check password
adminSchema.methods.comparePassword = async function(candidatePassword) {
    console.log('ADMIN PASSWORD COMPARISON:', {
        email: this.email,
        candidatePasswordLength: candidatePassword.length,
        storedPasswordHash: this.password
    });

    try {
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        console.log('BCRYPT COMPARISON RESULT:', {
            email: this.email,
            isMatch,
            candidatePasswordLength: candidatePassword.length
        });
        return isMatch;
    } catch (error) {
        console.error('PASSWORD COMPARISON ERROR:', {
            email: this.email,
            error: error.message
        });
        throw error;
    }
};

// Method to safely return admin data without sensitive information
adminSchema.methods.toJSON = function() {
    const adminObject = this.toObject();
    delete adminObject.password;
    delete adminObject.passwordResetToken;
    delete adminObject.passwordResetExpires;
    return adminObject;
};

// Post-save hook for logging
adminSchema.post('save', function(doc) {
    console.log('ADMIN SAVED:', {
        id: doc._id,
        email: doc.email,
        savedAt: new Date().toISOString()
    });
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
