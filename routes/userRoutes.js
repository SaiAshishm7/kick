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

module.exports = router;
