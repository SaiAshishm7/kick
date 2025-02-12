import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
    const [bookings, setBookings] = useState({ upcoming: [], past: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            navigate('/login');
            return;
        }

        fetchBookings(user._id);
    }, [navigate]);

    const fetchBookings = async (userId) => {
        try {
            const response = await axios.get(`http://localhost:5001/api/bookings/user/${userId}`);
            setBookings(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            setError('Failed to fetch bookings');
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            const response = await axios.post(`http://localhost:5001/api/bookings/${bookingId}/cancel`);
            console.log('Cancel response:', response.data);
            
            // Update the booking status in the local state
            setBookings(prevBookings => ({
                upcoming: prevBookings.upcoming.filter(booking => booking._id !== bookingId),
                past: [...prevBookings.past, { ...prevBookings.upcoming.find(b => b._id === bookingId), status: 'Cancelled' }]
            }));
            
            alert('Booking cancelled successfully');
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert(error.response?.data?.message || 'Failed to cancel booking');
        }
    };

    const formatDate = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>My Bookings</h2>
            
            <div>
                <h3>Upcoming Bookings</h3>
                {bookings.upcoming.length === 0 ? (
                    <p>No upcoming bookings</p>
                ) : (
                    bookings.upcoming.map(booking => (
                        <div key={booking._id} style={{
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '15px',
                            marginBottom: '15px',
                            backgroundColor: '#f9f9f9'
                        }}>
                            <h4>{booking.turfId.name}</h4>
                            <p>Location: {booking.turfId.location}</p>
                            <p>Date: {formatDate(booking.date)}</p>
                            <p>Time: {booking.startTime} - {booking.endTime}</p>
                            <p>Total Price: ₹{booking.totalPrice}</p>
                            <button 
                                onClick={() => handleCancelBooking(booking._id)}
                                style={{
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel Booking
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div style={{ marginTop: '30px' }}>
                <h3>Past Bookings</h3>
                {bookings.past.length === 0 ? (
                    <p>No past bookings</p>
                ) : (
                    bookings.past.map(booking => (
                        <div key={booking._id} style={{
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '15px',
                            marginBottom: '15px',
                            backgroundColor: '#f5f5f5',
                            opacity: '0.8'
                        }}>
                            <h4>{booking.turfId.name}</h4>
                            <p>Location: {booking.turfId.location}</p>
                            <p>Date: {formatDate(booking.date)}</p>
                            <p>Time: {booking.startTime} - {booking.endTime}</p>
                            <p>Total Price: ₹{booking.totalPrice}</p>
                            <span style={{
                                backgroundColor: '#6c757d',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.9em'
                            }}>
                                Completed
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default UserDashboard;
