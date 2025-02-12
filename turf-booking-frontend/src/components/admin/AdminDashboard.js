import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('bookings');
    const [bookings, setBookings] = useState([]);
    const [users, setUsers] = useState([]);
    const [turfs, setTurfs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'bookings':
                    const bookingsRes = await axios.get('http://localhost:5001/api/admin/bookings');
                    setBookings(bookingsRes.data);
                    break;
                case 'users':
                    const usersRes = await axios.get('http://localhost:5001/api/admin/users');
                    setUsers(usersRes.data);
                    break;
                case 'turfs':
                    const turfsRes = await axios.get('http://localhost:5001/api/turfs');
                    setTurfs(turfsRes.data);
                    break;
                default:
                    break;
            }
            setError(null);
        } catch (err) {
            setError('Error fetching data. Please try again.');
            console.error('Error:', err);
        }
        setLoading(false);
    };

    const handleUpdateBooking = async (bookingId, status) => {
        try {
            await axios.put(`http://localhost:5001/api/admin/bookings/${bookingId}`, { status });
            fetchData();
        } catch (err) {
            setError('Error updating booking status');
        }
    };

    const handleDeleteBooking = async (bookingId) => {
        if (window.confirm('Are you sure you want to delete this booking?')) {
            try {
                await axios.delete(`http://localhost:5001/api/admin/bookings/${bookingId}`);
                fetchData();
            } catch (err) {
                setError('Error deleting booking');
            }
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`http://localhost:5001/api/admin/users/${userId}`);
                fetchData();
            } catch (err) {
                setError('Error deleting user');
            }
        }
    };

    const handleDeleteTurf = async (turfId) => {
        if (window.confirm('Are you sure you want to delete this turf?')) {
            try {
                await axios.delete(`http://localhost:5001/api/turfs/${turfId}`);
                fetchData();
            } catch (err) {
                setError('Error deleting turf');
            }
        }
    };

    const renderBookings = () => (
        <div className="admin-table-container">
            <h3>Bookings Management</h3>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Turf</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map((booking) => (
                        <tr key={booking._id}>
                            <td>{booking.userId?.name || 'N/A'}</td>
                            <td>{booking.turfId?.name || 'N/A'}</td>
                            <td>{new Date(booking.date).toLocaleDateString()}</td>
                            <td>{`${booking.startTime} - ${booking.endTime}`}</td>
                            <td>{booking.status}</td>
                            <td className="action-buttons">
                                <select 
                                    value={booking.status}
                                    onChange={(e) => handleUpdateBooking(booking._id, e.target.value)}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                                <button 
                                    className="delete-btn"
                                    onClick={() => handleDeleteBooking(booking._id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderUsers = () => (
        <div className="admin-table-container">
            <h3>Users Management</h3>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user._id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td className="action-buttons">
                                <button 
                                    className="delete-btn"
                                    onClick={() => handleDeleteUser(user._id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderTurfs = () => (
        <div className="admin-table-container">
            <h3>Turfs Management</h3>
            <div className="add-turf-button">
                <button onClick={() => navigate('/admin/add-turf')} className="add-btn">
                    Add New Turf
                </button>
            </div>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Price/Hour</th>
                        <th>Rating</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {turfs.map((turf) => (
                        <tr key={turf._id}>
                            <td>{turf.name}</td>
                            <td>{turf.location}</td>
                            <td>₹{turf.hourlyPrice}</td>
                            <td>{turf.averageRating.toFixed(1)} ⭐</td>
                            <td className="action-buttons">
                                <button 
                                    className="edit-btn"
                                    onClick={() => navigate(`/admin/edit-turf/${turf._id}`)}
                                >
                                    Edit
                                </button>
                                <button 
                                    className="delete-btn"
                                    onClick={() => handleDeleteTurf(turf._id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="admin-dashboard">
            <h2>Admin Dashboard</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="admin-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bookings')}
                >
                    Bookings
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    Users
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'turfs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('turfs')}
                >
                    Turfs
                </button>
            </div>

            {loading ? (
                <div className="loading">Loading...</div>
            ) : (
                <div className="tab-content">
                    {activeTab === 'bookings' && renderBookings()}
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'turfs' && renderTurfs()}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
