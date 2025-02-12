import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BookingPage = () => {
    const { turfId } = useParams();
    const [turf, setTurf] = useState(null);
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    useEffect(() => {
        axios.get(`http://localhost:5001/api/turfs/${turfId}`)
            .then(response => setTurf(response.data))
            .catch(error => console.error('Error:', error));
    }, [turfId]);

    const formatTimeWithAMPM = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!user) {
            alert('Please login first');
            return;
        }

        // Validate end time is after start time
        const [startHour] = startTime.split(':');
        const [endHour] = endTime.split(':');
        if (parseInt(endHour) <= parseInt(startHour)) {
            alert('End time must be after start time');
            return;
        }

        try {
            await axios.post('http://localhost:5001/api/bookings', {
                userId: user._id,
                turfId,
                date,
                startTime: formatTimeWithAMPM(startTime),
                endTime: formatTimeWithAMPM(endTime)
            });
            alert('Booking successful!');
        } catch (error) {
            alert(error.response?.data?.message || 'Booking failed. Please try again.');
            console.error('Error:', error);
        }
    };

    if (!turf) return <div>Loading...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>{turf.name}</h2>
            <p>Location: {turf.location}</p>
            <p>Price: ₹{turf.hourlyPrice}/hr</p>

            <form onSubmit={handleBooking} style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Date: </label>
                    <input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)} 
                        required 
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label>Start Time: </label>
                    <input 
                        type="time" 
                        value={startTime} 
                        onChange={(e) => setStartTime(e.target.value)} 
                        required 
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label>End Time: </label>
                    <input 
                        type="time" 
                        value={endTime} 
                        onChange={(e) => setEndTime(e.target.value)} 
                        required 
                    />
                </div>

                <button 
                    type="submit" 
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Book Now
                </button>
            </form>
        </div>
    );
};

export default BookingPage;

