const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String, default: '' },  // Path to stored image
    notifications: [
        {
            message: String,
            date: Date,
        }
    ]
});


module.exports = mongoose.model('User', userSchema);
