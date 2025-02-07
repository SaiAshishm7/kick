const User = require('../models/User');

exports.uploadProfilePicture = async (req, res) => {
    const { userId } = req.body;
    const filePath = req.file.path;  // Path to uploaded file

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found!' });

        user.profilePicture = filePath;  // Save the file path in the user model
        await user.save();

        res.status(200).json({ message: 'Profile picture uploaded successfully!', user });
    } catch (err) {
        res.status(500).json({ message: 'Server error!' });
    }
};
