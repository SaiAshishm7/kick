const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Multer storage configuration for profile image
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/profiles'));
    },
    filename: function(req, file, cb) {
        cb(null, `profile-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        
        cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
    }
});

// Get User Profile
router.get('/me', async (req, res) => {
    try {
        // Assuming authentication middleware has set req.user
        const userId = req.user._id;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get profile with booking history
        const profileWithBookings = await user.getProfileWithBookings();

        res.json(profileWithBookings);
    } catch (err) {
        console.error('Profile Fetch Error:', err);
        res.status(500).json({ 
            message: 'Error fetching profile', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

// Update User Profile
router.put('/me', async (req, res) => {
    try {
        const userId = req.user._id;
        const { 
            firstName, 
            lastName, 
            bio, 
            phone, 
            address,
            preferences 
        } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update profile fields
        user.profile.firstName = firstName || user.profile.firstName;
        user.profile.lastName = lastName || user.profile.lastName;
        user.profile.bio = bio || user.profile.bio;
        user.profile.phone = phone || user.profile.phone;

        // Update address if provided
        if (address) {
            user.profile.address = {
                ...user.profile.address,
                ...address
            };
        }

        // Update preferences if provided
        if (preferences) {
            user.preferences = {
                ...user.preferences,
                ...preferences
            };
        }

        await user.save();

        // Return updated profile
        const updatedProfile = await user.getProfileWithBookings();
        res.json(updatedProfile);
    } catch (err) {
        console.error('Profile Update Error:', err);
        res.status(500).json({ 
            message: 'Error updating profile', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

// Upload Profile Picture
router.post('/picture', upload.single('profileImage'), async (req, res) => {
    try {
        const userId = req.user._id;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update profile picture
        user.profile.profileImage = req.file.filename;
        await user.save();

        res.json({
            message: 'Profile picture updated successfully',
            profileImage: user.profile.profileImage
        });
    } catch (err) {
        console.error('Profile Picture Upload Error:', err);
        res.status(500).json({ 
            message: 'Error uploading profile picture', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

// Get User Booking History
router.get('/bookings', async (req, res) => {
    try {
        const userId = req.user._id;

        const bookings = await Booking.find({ user: userId })
            .sort({ date: -1 })
            .populate('turf', 'name location')
            .limit(50);

        res.json({
            message: 'Booking history retrieved',
            bookings
        });
    } catch (err) {
        console.error('Booking History Fetch Error:', err);
        res.status(500).json({ 
            message: 'Error fetching booking history', 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

module.exports = router;
