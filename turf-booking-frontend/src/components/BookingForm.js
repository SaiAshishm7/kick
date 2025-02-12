// src/components/BookingForm.js

import React, { useState } from 'react';
import axios from 'axios';

const BookingForm = ({ turfId }) => {
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [message, setMessage] = useState('');

    const handleBooking = async (e) => {
        e.preventDefault();
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                setMessage('Please login to book a turf');
                return;
            }

            const res = await axios.post('http://localhost:5001/api/bookings', {
                user: user._id,
                turf: turfId,
                sport: 'football', // You might want to make this selectable
                date,
                startTime,
                endTime
            });
            setMessage('Booking successful! 🎉');
        } catch (err) {
            console.error('Booking error:', err);
            setMessage('Booking failed. Please try again.');
        }
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <h3>Book This Turf</h3>
            <form onSubmit={handleBooking}>
                <label>Date:</label><br />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /><br /><br />

                <label>Start Time:</label><br />
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required /><br /><br />

                <label>End Time:</label><br />
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required /><br /><br />

                <button type="submit">Confirm Booking</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default BookingForm;
