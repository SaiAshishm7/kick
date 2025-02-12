// src/pages/Dashboard.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css'; // Assuming you have a CSS file for styling

const Dashboard = () => {
    const [turfs, setTurfs] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:5001/api/turfs')
            .then(response => setTurfs(response.data))
            .catch(error => console.error('Error fetching turfs:', error));
    }, []);

    return (
        <div className="dashboard-container">
            <h1>Welcome to KickNClick Dashboard!</h1>
            <p>Select a turf to book your game!</p>

            <div className="turf-list">
                {turfs.length > 0 ? (
                    turfs.map(turf => (
                        <div key={turf._id} className="turf-card">
                            <h3>{turf.name}</h3>
                            <p>{turf.location}</p>
                            <p>Price: ₹{turf.hourlyPrice}/hr</p>
                            <Link to={`/book/${turf._id}`}>
                                <button>Book Now</button>
                            </Link>
                        </div>
                    ))
                ) : (
                    <p>No turfs available at the moment.</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
