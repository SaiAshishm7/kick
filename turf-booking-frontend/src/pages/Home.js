// src/pages/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
    return (
        <div className="home-container">
            <header className="home-header">
                <h1>kickNclick</h1>
                <nav>
                    <Link to="/login">Login</Link>
                    <Link to="/signup">Sign Up</Link>
                </nav>
            </header>

            <main className="home-main">
                <h2>Your Ultimate Turf Booking Solution</h2>
                <p>Book your favorite sports turfs effortlessly. Manage your bookings, leave reviews, and never miss a game!</p>
                <Link to="/signup" className="cta-button">Get Started</Link>
            </main>

            <footer className="home-footer">
                <p>&copy; 2025 kickNclick. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Home;
