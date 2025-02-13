import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BookingPage.css';

const BookingPage = () => {
    const { turfId } = useParams();
    const navigate = useNavigate();
    const [turf, setTurf] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        date: '',
        startTime: '',
        endTime: '',
        sport: 'football' // default sport
    });

    // Get turf details
    useEffect(() => {
        const fetchTurf = async () => {
            try {
                const response = await axios.get(`http://localhost:5001/api/turfs/${turfId}`);
                setTurf(response.data);
            } catch (error) {
                console.error('Error fetching turf:', error);
                setError('Failed to load turf details');
            }
        };
        fetchTurf();
    }, [turfId]);

    // Handle form changes
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear any errors when user makes changes
    };

    const calculateDuration = (start, end) => {
        const [startHour, startMinute] = start.split(':').map(Number);
        const [endHour, endMinute] = end.split(':').map(Number);
        return (endHour - startHour) + (endMinute - startMinute) / 60;
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            setError('Please login first');
            navigate('/login');
            return;
        }

        // Validate sport selection
        const sport = formData.sport || 'football';
        if (!['football', 'cricket', 'basketball'].includes(sport)) {
            setError('Please select a valid sport');
            setLoading(false);
            return;
        }

        try {
            // Create booking data matching the Booking model fields
            const bookingData = {
                user: user._id,     
                turf: turfId,      
                sport: sport,       // Explicitly set sport
                date: formData.date,
                startTime: formData.startTime,
                endTime: formData.endTime
            };

            console.log('Sending booking data:', bookingData);

            const response = await axios.post('http://localhost:5001/api/bookings', bookingData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            console.log('Booking response:', response.data);
            alert('Booking successful!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Booking error:', error);
            
            // More detailed error handling
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                const errorMessage = error.response.data.message || 
                                     error.response.data.error || 
                                     'Booking failed. Please try again.';
                
                setError(errorMessage);
                
                // Log additional error details
                console.error('Error response:', error.response.data);
                console.error('Error status:', error.response.status);
            } else if (error.request) {
                // The request was made but no response was received
                setError('No response from server. Please check your internet connection.');
            } else {
                // Something happened in setting up the request that triggered an Error
                setError('Error setting up booking request');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!turf) return <div className="loading">Loading...</div>;

    return (
        <div className="booking-container">
            <div className="booking-card">
                <h2>{turf.name}</h2>
                <div className="turf-details">
                    <p><i className="fas fa-map-marker-alt"></i> {turf.location}</p>
                    <p><i className="fas fa-rupee-sign"></i> {turf.hourlyPrice}/hr</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleBooking} className="booking-form">
                    <div className="form-group">
                        <label>Sport</label>
                        <select
                            name="sport"
                            value={formData.sport}
                            onChange={handleChange}
                            required
                        >
                            <option value="football">Football</option>
                            <option value="cricket">Cricket</option>
                            <option value="basketball">Basketball</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Start Time</label>
                        <input
                            type="time"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>End Time</label>
                        <input
                            type="time"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={`booking-button ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'Booking...' : 'Book Now'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BookingPage;
