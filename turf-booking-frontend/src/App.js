// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import TurfList from './components/TurfList';
import TurfDetails from './components/TurfDetails'; 
import BookingPage from './pages/BookingPage';
import Navbar from './components/Navbar';
import Home from './pages/Home'; 
import Dashboard from './pages/Dashboard';
import UserDashboard from './pages/UserDashboard'; // Turf detail page with booking/review

const App = () => {
    return (
        <Router>
            <div>
                <h1>kickNclick Turf Booking App</h1>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} /> 
                    <Route path="/dashboard" element={<Dashboard />} /> 
                    <Route path="/my-bookings" element={<UserDashboard />} />
                    <Route path="/turf/:id" element={<TurfDetails />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/book/:turfId" element={<BookingPage />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;




