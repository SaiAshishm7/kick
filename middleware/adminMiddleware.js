const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const adminMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            console.error('No token provided');
            return res.status(401).json({ 
                message: 'No token, authorization denied',
                details: 'Authentication token is missing'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kickNclick_secret_key_2025');
        
        console.log('Token Decoded:', {
            id: decoded.id,
            email: decoded.email,
            isAdmin: decoded.isAdmin
        });

        // Check if token indicates admin
        if (!decoded.isAdmin) {
            console.error('Non-admin token attempted to access admin routes');
            return res.status(403).json({ 
                message: 'Access denied. Admin privileges required.',
                details: 'Token does not have admin privileges'
            });
        }

        // Verify admin exists in database
        const admin = await Admin.findById(decoded.id);
        
        if (!admin) {
            console.error('Admin not found in database:', decoded.id);
            return res.status(401).json({ 
                message: 'Admin not found',
                details: 'No admin account exists for this token'
            });
        }

        // Add admin to request object
        req.admin = admin;
        next();
    } catch (err) {
        console.error('Admin Middleware Error:', {
            message: err.message,
            name: err.name,
            stack: err.stack
        });

        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid token',
                details: 'The provided authentication token is invalid'
            });
        }

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token expired',
                details: 'Your authentication token has expired'
            });
        }

        res.status(500).json({ 
            message: 'Server authentication error', 
            details: 'An unexpected error occurred during authentication'
        });
    }
};

module.exports = adminMiddleware;
