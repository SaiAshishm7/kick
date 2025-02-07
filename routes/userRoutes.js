const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const { uploadProfilePicture } = require('../controllers/userController');

// Route to upload profile picture
router.post('/upload-profile-picture', upload.single('profilePicture'), uploadProfilePicture);

module.exports = router;
