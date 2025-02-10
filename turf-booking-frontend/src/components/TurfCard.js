// src/components/TurfCard.js

import React from 'react';
import { Link } from 'react-router-dom';

const TurfCard = ({ turf }) => {
    return (
        <div style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '15px',
            margin: '10px',
            width: '250px'
        }}>
            <h3>{turf.name}</h3>
            <p>Location: {turf.location}</p>
            <p>Price: ₹{turf.hourlyPrice}/hr</p>
            <Link to={`/turf/${turf._id}`}>
                <button style={{ padding: '8px 12px' }}>View Details</button>
            </Link>
        </div>
    );
};

export default TurfCard;
