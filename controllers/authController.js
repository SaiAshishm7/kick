const User = require('../models/User');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Helper function to generate JWT token
const generateToken = (user, isAdmin = false) => {
    return jwt.sign(
        { 
            id: user._id,
            email: user.email,
            isAdmin: isAdmin 
        },
        process.env.JWT_SECRET || 'kickNclick_secret_key_2025',
        { expiresIn: '24h' }
    );
};

// User Registration
exports.userRegister = async (req, res) => {
    try {
        console.log('Registration request received:', req.body);
        const { name, email, password } = req.body;

        // Input validation
        if (!name || !email || !password) {
            console.log('Missing required fields');
            return res.status(400).json({
                message: 'All fields are required',
                details: {
                    name: !name ? 'Name is required' : null,
                    email: !email ? 'Email is required' : null,
                    password: !password ? 'Password is required' : null
                }
            });
        }

        if (password.length < 6) {
            console.log('Password too short');
            return res.status(400).json({
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('Email already exists:', email);
            return res.status(400).json({ message: 'Email already exists!' });
        }

        // Hash password
        console.log('Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        console.log('Creating new user...');
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            preferences: {
                emailNotifications: true,
                smsNotifications: false,
                language: 'en'
            }
        });

        // Save user
        console.log('Saving user to database...');
        await newUser.save();
        console.log('User saved successfully');

        // Generate token
        console.log('Generating token...');
        const token = generateToken(newUser);

        console.log('Registration successful for:', email);
        res.status(201).json({
            success: true,
            message: 'User registered successfully!',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                preferences: newUser.preferences
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        console.error('Error stack:', err.stack);
        
        // Handle mongoose validation errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(error => error.message);
            return res.status(400).json({
                message: 'Validation error',
                errors
            });
        }

        // Handle duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({
                message: 'Email already exists!'
            });
        }

        res.status(500).json({
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// User Login
exports.userLogin = async (req, res) => {
    try {
        console.log('Login attempt received:', { email: req.body.email });
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            console.log('Missing login credentials');
            return res.status(400).json({
                message: 'Email and password are required',
                details: {
                    email: !email ? 'Email is required' : null,
                    password: !password ? 'Password is required' : null
                }
            });
        }

        // Find user and explicitly select password field
        console.log('Finding user...');
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ message: 'Invalid credentials!' });
        }

        console.log('User found, checking password...');
        let isValidPassword = false;

        // First try direct comparison (for old plain text passwords)
        if (user.password === password) {
            console.log('Plain text password match, upgrading to hash...');
            isValidPassword = true;
            // Update to hashed password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();
            console.log('Password upgraded to hash');
        } else {
            // Try comparing with bcrypt
            try {
                console.log('Comparing with bcrypt...');
                isValidPassword = await bcrypt.compare(password, user.password);
                console.log('Password comparison result:', isValidPassword);
            } catch (error) {
                console.error('Password comparison error:', error);
            }
        }

        if (!isValidPassword) {
            console.log('Invalid password for user:', email);
            return res.status(400).json({ message: 'Invalid credentials!' });
        }

        // Check if user is active
        if (user.status !== 'active') {
            console.log('Inactive user attempted login:', email);
            return res.status(400).json({
                message: `Your account is ${user.status}. Please contact support.`
            });
        }

        // Update last login
        console.log('Updating last login...');
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        console.log('Generating token...');
        const token = generateToken(user);

        console.log('Login successful for:', email);
        res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                _id: user._id, // Changed from id to _id
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                profilePicture: user.profilePicture,
                preferences: user.preferences,
                status: user.status,
                lastLogin: user.lastLogin
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Admin Registration
exports.adminRegister = async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error('VALIDATION ERROR:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        console.log('ADMIN REGISTRATION ATTEMPT:', {
            name,
            email,
            passwordLength: password ? password.length : 'No password',
            timestamp: new Date().toISOString()
        });

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            console.log('ADMIN ALREADY EXISTS:', {
                email,
                existingAdminId: existingAdmin._id
            });
            
            // Optional: You can choose to update the existing admin or return an error
            await Admin.deleteOne({ email });
            console.log('DELETED EXISTING ADMIN:', email);
        }

        // Always hash the password ONCE
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        console.log('PASSWORD HASHING:', {
            saltRounds: 10,
            hashedPasswordLength: hashedPassword.length,
            email
        });
        
        // Create new admin with pre-hashed password
        const newAdmin = new Admin({
            name,
            email,
            password: hashedPassword  // Use the pre-hashed password
        });

        // Save the admin
        const savedAdmin = await newAdmin.save();
        
        console.log('ADMIN SAVED:', {
            id: savedAdmin._id,
            email: savedAdmin.email,
            savedAt: new Date().toISOString()
        });

        // Verify admin was saved
        const verifyAdmin = await Admin.findOne({ email }).select('+password');
        console.log('VERIFY ADMIN:', {
            found: !!verifyAdmin,
            id: verifyAdmin?._id,
            email: verifyAdmin?.email,
            passwordHash: verifyAdmin?.password
        });

        // Generate token
        const token = generateToken(savedAdmin, true);

        res.status(201).json({
            message: 'Admin registered successfully!',
            token,
            admin: {
                id: savedAdmin._id,
                name: savedAdmin.name,
                email: savedAdmin.email
            }
        });
    } catch (err) {
        console.error('CATASTROPHIC Admin registration error:', {
            message: err.message,
            stack: err.stack,
            name: err.name
        });
        res.status(500).json({ 
            message: 'Catastrophic server error during admin registration', 
            error: err.message,
            stack: err.stack
        });
    }
};

// Admin Login
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('EXTREME VERBOSE Admin Login Attempt:', { 
            email, 
            passwordLength: password ? password.length : 'No password provided',
            passwordContent: password ? password : 'No password',
            timestamp: new Date().toISOString()
        });

        // Find admin and explicitly select password field
        const admin = await Admin.findOne({ email }).select('+password');
        
        if (!admin) {
            console.error('CRITICAL: Admin not found:', {
                email,
                allAdmins: await Admin.find({}).select('email')
            });
            return res.status(400).json({ 
                message: 'No admin account found',
                details: 'Please register first or check your email',
                email: email
            });
        }

        // Log admin details for debugging
        console.log('ADMIN FOUND:', {
            id: admin._id,
            email: admin.email,
            passwordHash: admin.password  // BE CAREFUL IN PRODUCTION
        });

        // Perform manual password comparison with extensive logging
        const bcryptCompareResult = await bcrypt.compare(password, admin.password);
        
        console.log('MANUAL BCRYPT COMPARISON:', {
            providedPassword: password,
            storedHash: admin.password,
            compareResult: bcryptCompareResult
        });

        // Use the model's comparePassword method with logging
        const isValidPassword = await admin.comparePassword(password);
        
        console.log('PASSWORD COMPARISON METHODS:', {
            modelCompareMethod: isValidPassword,
            manualBcryptCompare: bcryptCompareResult,
            email: admin.email
        });

        // Detailed password debugging
        console.log('PASSWORD DEBUG:', {
            providedPassword: password,
            providedPasswordLength: password.length,
            storedPasswordHash: admin.password,
            storedPasswordHashLength: admin.password.length,
            bcryptCompareResult,
            isValidPassword
        });

        if (!isValidPassword) {
            console.error('AUTHENTICATION FAILED:', {
                email,
                reason: 'Invalid password',
                providedPassword: password,
                providedPasswordLength: password.length,
                storedPasswordHash: admin.password
            });
            return res.status(400).json({ 
                message: 'Invalid credentials',
                details: 'Password does not match',
                debugInfo: {
                    emailFound: !!admin,
                    providedPassword: password,
                    storedPasswordHash: admin.password
                }
            });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Generate token
        const token = generateToken(admin, true);

        res.status(200).json({
            message: 'Admin login successful!',
            token,
            admin: admin.toJSON() // Use toJSON method to exclude sensitive data
        });
    } catch (err) {
        console.error('CATASTROPHIC Admin login error:', {
            message: err.message,
            name: err.name,
            stack: err.stack
        });
        res.status(500).json({ 
            message: 'Catastrophic server error during admin login', 
            error: err.message,
            stack: err.stack
        });
    }
};
