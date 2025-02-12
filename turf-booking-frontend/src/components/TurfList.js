// src/components/TurfList.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const TurfList = () => {
    const [turfs, setTurfs] = useState([]);

    useEffect(() => {
        const fetchTurfs = async () => {
            try {
                const res = await axios.get('http://localhost:5001/api/turfs');
                setTurfs(res.data);
            } catch (err) {
                console.error('Error fetching turfs:', err);
            }
        };

        fetchTurfs();
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <h2>Available Turfs</h2>
            {turfs.length > 0 ? (
                turfs.map(turf => (
                    <div key={turf._id} style={{ borderBottom: '1px solid #ccc', marginBottom: '15px' }}>
                        <h3>{turf.name}</h3>
                        <p>Location: {turf.location}</p>
                        <Link to={`/turf/${turf._id}`}>View & Book</Link>
                    </div>
                ))
            ) : (
                <p>No turfs available.</p>
            )}
        </div>
    );
};

export default TurfList;
