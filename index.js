// index.js
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const { body } = require('express-validator');
const authRoutes = require('./routes/authRoutes');
const turfRoutes = require('./routes/turfRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const searchRoutes = require('./routes/searchRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const profileRoutes = require('./routes/profileRoutes'); // Import profile routes
require('dotenv').config();

const app = express();

// CORS configuration
const corsOptions = {
    origin: ['http://localhost:3000'], // Frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Request body:', req.body);
    }
    next();
});

// Ensure uploads directory exists
const fs = require('fs');
const path = require('path');

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const profileUploadsDir = path.join(uploadsDir, 'profiles');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(profileUploadsDir)) {
    fs.mkdirSync(profileUploadsDir);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/turfs', turfRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/profile', profileRoutes); // Use profile routes

// 404 handler
app.use((req, res) => {
    console.log(`404 - Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
        message: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    console.error('Stack:', err.stack);

    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Validation error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
        return res.status(400).json({
            message: 'Duplicate key error',
            field: Object.keys(err.keyPattern)[0]
        });
    }

    // Handle other errors
    res.status(err.status || 500).json({
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        mongoose.set('debug', true);  // Enable Mongoose debug mode
        
        // Mongoose connection event listeners
        mongoose.connection.on('connected', () => {
            console.log('MONGOOSE: Connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('MONGOOSE: Connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MONGOOSE: Disconnected from MongoDB');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MONGOOSE: Reconnected to MongoDB');
        });

        await mongoose.connect('mongodb://localhost:27017/kickNclick', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,  // Timeout after 10 seconds
            socketTimeoutMS: 45000,  // Close sockets after 45 seconds of inactivity
            family: 4  // Use IPv4, skip trying IPv6
        });
        
        console.log('MONGOOSE: Connection Details', {
            state: mongoose.connection.readyState,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name
        });
        
        const port = process.env.PORT || 5001;
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            console.log(`API available at http://localhost:${port}/api`);
            console.log('CORS enabled for:', corsOptions.origin);
        });
    } catch (err) {
        console.error('CRITICAL: Failed to start server:', {
            message: err.message,
            stack: err.stack,
            name: err.name
        });
        process.exit(1);
    }
};

startServer();
