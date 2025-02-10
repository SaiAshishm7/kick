// src/pages/Home.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TurfCard from '../components/TurfCard';

const Home = () => {
    const [turfs, setTurfs] = useState([]);

    useEffect(() => {
        const fetchTurfs = async () => {
            try {
                const res = await axios.get('http://localhost:5001/api/turfs/all');
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
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {turfs.map(turf => (
                    <TurfCard key={turf._id} turf={turf} />
                ))}
            </div>
        </div>
    );
};

export default Home;
