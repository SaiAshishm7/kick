// index.js

const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const turfRoutes = require('./routes/turfRoutes'); 
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes); 
app.use('/api/booking', bookingRoutes);  // Booking routes
app.use('/api/user', userRoutes);  // User-related routes
app.use('/api/admin', adminRoutes);  // Admin-related routes
app.use('/api/turf', turfRoutes);// Turf management routes

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/kickNclick', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected successfully');
        app.listen(5001, () => console.log('Server running on port 5001'));
    })
    .catch(err => console.error('MongoDB connection failed:', err));
