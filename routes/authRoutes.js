// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const {
    userRegister,
    userLogin,
    adminRegister,
    adminLogin
} = require('../controllers/authController');

// User Routes
router.post('/user/register', userRegister);
router.post('/user/login', userLogin);

// Admin Routes
router.post('/admin/register', adminRegister);
router.post('/admin/login', adminLogin);

module.exports = router;
