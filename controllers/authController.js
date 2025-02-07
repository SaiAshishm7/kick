const User = require('../models/User');
const Admin = require('../models/Admin');

// User Registration
exports.userRegister = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already exists!' });

        const newUser = new User({ name, email, password });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        res.status(500).json({ message: 'Server error!' });
    }
};

// User Login
exports.userLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(400).json({ message: 'Invalid credentials!' });
        }
        res.status(200).json({ message: 'Login successful!', user });
    } catch (err) {
        res.status(500).json({ message: 'Server error!' });
    }
};

// Admin Registration
exports.adminRegister = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) return res.status(400).json({ message: 'Admin email already exists!' });

        const newAdmin = new Admin({ name, email, password });
        await newAdmin.save();

        res.status(201).json({ message: 'Admin registered successfully!' });
    } catch (err) {
        res.status(500).json({ message: 'Server error!' });
    }
};

// Admin Login
exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ email });
        if (!admin || admin.password !== password) {
            return res.status(400).json({ message: 'Invalid credentials!' });
        }
        res.status(200).json({ message: 'Admin login successful!', admin });
    } catch (err) {
        res.status(500).json({ message: 'Server error!' });
    }
};
