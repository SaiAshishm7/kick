// const express = require('express');
// const multer = require('multer');
// const router = express.Router();
// const User = require('../models/User');

// // Multer setup for file uploads
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => cb(null, 'uploads/profile_pics'),
//     filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
// });
// const upload = multer({ storage: storage });

// // Upload Profile Picture
// router.post('/:userId/upload', upload.single('profilePicture'), async (req, res) => {
//     try {
//         const user = await User.findByIdAndUpdate(
//             req.params.userId,
//             { profilePicture: req.file.path },
//             { new: true }
//         );

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         res.status(200).json({ message: 'Profile picture uploaded successfully', user });
//     } catch (err) {
//         res.status(400).json({ message: 'Error uploading profile picture', error: err });
//     }
// });
// // Storage configuration
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/profile_pictures/');
//     },
//     filename: (req, file, cb) => {
//         cb(null, `${req.params.userId}_${Date.now()}${path.extname(file.originalname)}`);
//     }
// });

// const upload = multer({ storage });

// module.exports = router;
// routes/userRoutes.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');

const router = express.Router();

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profile_pictures/');
    },
    filename: (req, file, cb) => {
        cb(null, `${req.params.userId}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Upload Profile Picture
router.post('/:userId/upload', upload.single('profilePicture'), async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { profilePicture: req.file.path },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Profile picture uploaded successfully', user });
    } catch (err) {
        res.status(400).json({ message: 'Error uploading profile picture', error: err });
    }
});


// Signup Route
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const newUser = new User({ name, email, password });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
});
// **Login Route**
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
});

module.exports = router;
