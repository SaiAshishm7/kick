// src/pages/TurfList.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const TurfList = () => {
    const [turfs, setTurfs] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:5001/api/turfs/all')
            .then(response => setTurfs(response.data))
            .catch(error => console.error('Error fetching turfs:', error));
    }, []);

    return (
        <div>
            <h1>Available Turfs</h1>
            {turfs.length > 0 ? (
                turfs.map(turf => (
                    <div key={turf._id} style={{ border: '1px solid black', padding: '10px', margin: '10px' }}>
                        <h2>{turf.name}</h2>
                        <p>Location: {turf.location}</p>
                        <p>Hourly Price: ₹{turf.hourlyPrice}</p>
                        <div className="turf-actions">
                            <Link to={`/turfs/${turf._id}`} className="view-details-btn">View Details</Link>
                            <Link to={`/book/${turf._id}`} className="book-now-btn">Book Now</Link>
                        </div>
                    </div>
                ))
            ) : (
                <p>No turfs available.</p>
            )}
        </div>
    );
};
import { Link } from 'react-router-dom';

// Inside the map function in TurfList.js
{turfs.map(turf => (
  <div key={turf._id}>
    <h3>{turf.name}</h3>
    <p>{turf.location}</p>
    <Link to={`/turfs/${turf._id}`}>View Details</Link>
  </div>
))}


export default TurfList;
