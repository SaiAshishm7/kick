// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     profilePic: { type: String, default: '' } // Path to uploaded image
// });

// module.exports = mongoose.model('User', userSchema);
// models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String }  // Path to the profile picture
}, { timestamps: true });

const User = mongoose.model('User', userSchema);


const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

userSchema.add({
    notifications: [notificationSchema]
});

module.exports = User;
