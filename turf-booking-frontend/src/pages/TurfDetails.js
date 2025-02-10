// src/pages/TurfDetails.js

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import BookingForm from '../components/BookingForm';
import ReviewSection from '../components/ReviewSection';

const TurfDetails = () => {
    const { id } = useParams();
    const [turf, setTurf] = useState(null);

    useEffect(() => {
        const fetchTurf = async () => {
            try {
                const res = await axios.get(`http://localhost:5001/api/turfs/${id}`);
                setTurf(res.data);
            } catch (err) {
                console.error('Error fetching turf details:', err);
            }
        };

        fetchTurf();
    }, [id]);

    if (!turf) return <p>Loading...</p>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>{turf.name}</h2>
            <p>Location: {turf.location}</p>
            <p>Price per hour: ₹{turf.hourlyPrice}</p>
            <p>Available Sports: {turf.availableSports.join(', ')}</p>

            <BookingForm turfId={turf._id} />
            <ReviewSection turfId={turf._id} reviews={turf.reviews} />
        </div>
    );
};

export default TurfDetails;
