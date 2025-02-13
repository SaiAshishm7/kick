// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AdminDashboard from './components/admin/AdminDashboard';
import AddTurf from './components/admin/AddTurf';
import EditTurf from './components/admin/EditTurf';
import TurfList from './components/TurfList';
import TurfDetails from './components/TurfDetails'; 
import BookingPage from './pages/BookingPage';
import Navbar from './components/Navbar';
import Home from './pages/Home'; 
import Dashboard from './pages/Dashboard';
import UserDashboard from './pages/UserDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute'; // Turf detail page with booking/review

const App = () => {
    return (
        <Router>
            <div>
                <h1>kickNclick Turf Booking App</h1>
                <Navbar />
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} /> 
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/turf/:id" element={<TurfDetails />} />

                    {/* Protected User Routes */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/my-bookings" element={
                        <ProtectedRoute>
                            <UserDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    } />
                    <Route path="/book/:turfId" element={
                        <ProtectedRoute>
                            <BookingPage />
                        </ProtectedRoute>
                    } />

                    {/* Protected Admin Routes */}
                    <Route path="/admin" element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/add-turf" element={
                        <ProtectedRoute requiredRole="admin">
                            <AddTurf />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/edit-turf/:id" element={
                        <ProtectedRoute requiredRole="admin">
                            <EditTurf />
                        </ProtectedRoute>
                    } />
                </Routes>
            </div>
        </Router>
    );
};

export default App;




