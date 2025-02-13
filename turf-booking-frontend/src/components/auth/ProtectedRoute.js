import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole = null }) => {
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!user || !token) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole === 'admin' && !user.isAdmin) {
        // Redirect to home if user is not an admin
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
