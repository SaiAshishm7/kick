import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    return (
        <nav className="navbar">
            <div className="nav-left">
                <Link to="/" className="nav-link">Home</Link>
                <Link to="/dashboard" className="nav-link">Browse Turfs</Link>
            </div>
            <div className="nav-right">
                {user ? (
                    <>
                        <Link to="/my-bookings" className="nav-link">My Bookings</Link>
                        <Link to="/profile" className="nav-link">Profile</Link>
                        <button onClick={handleLogout} className="logout-btn">Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-link">Login</Link>
                        <Link to="/signup" className="nav-link">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
