import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalTurfs: 0,
        totalBookings: 0,
        revenue: 0
    });
    const [users, setUsers] = useState([]);
    const [turfs, setTurfs] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Get token from localStorage
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            // Fetch all data using admin routes
            const [statsRes, usersRes, turfsRes, bookingsRes] = await Promise.all([
                axios.get('http://localhost:5001/api/admin/stats', config),
                axios.get('http://localhost:5001/api/admin/users', config),
                axios.get('http://localhost:5001/api/admin/turfs', config),
                axios.get('http://localhost:5001/api/admin/bookings', config)
            ]);

            setUsers(usersRes.data);
            setTurfs(turfsRes.data);
            setBookings(bookingsRes.data);
            setStats(statsRes.data);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    };

    const handleUserAction = async (userId, action) => {
        try {
            await axios.post(`http://localhost:5001/api/users/${userId}/${action}`);
            fetchDashboardData(); // Refresh data
        } catch (error) {
            console.error(`Error ${action} user:`, error);
        }
    };

    const handleTurfAction = async (turfId, action) => {
        try {
            if (action === 'delete') {
                await axios.delete(`http://localhost:5001/api/turfs/${turfId}`);
            } else {
                await axios.post(`http://localhost:5001/api/turfs/${turfId}/${action}`);
            }
            fetchDashboardData(); // Refresh data
        } catch (error) {
            console.error(`Error ${action} turf:`, error);
        }
    };

    const handleBookingAction = async (bookingId, action) => {
        try {
            await axios.post(`http://localhost:5001/api/bookings/${bookingId}/${action}`);
            fetchDashboardData(); // Refresh data
        } catch (error) {
            console.error(`Error ${action} booking:`, error);
        }
    };

    const renderOverview = () => (
        <div className="overview-section">
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Users</h3>
                    <p>{stats.totalUsers}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Turfs</h3>
                    <p>{stats.totalTurfs}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Bookings</h3>
                    <p>{stats.totalBookings}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Revenue</h3>
                    <p>₹{stats.revenue}</p>
                </div>
            </div>
        </div>
    );

    const renderUsers = () => (
        <div className="users-section">
            <h3>User Management</h3>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user._id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{user.status}</td>
                            <td>
                                <button onClick={() => handleUserAction(user._id, 'block')}>
                                    {user.status === 'blocked' ? 'Unblock' : 'Block'}
                                </button>
                                <button onClick={() => handleUserAction(user._id, 'delete')}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderTurfs = () => (
        <div className="turfs-section">
            <h3>Turf Management</h3>
            <button className="add-turf-btn">Add New Turf</button>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Price/Hour</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {turfs.map(turf => (
                        <tr key={turf._id}>
                            <td>{turf.name}</td>
                            <td>{turf.location}</td>
                            <td>₹{turf.hourlyPrice}</td>
                            <td>
                                <button onClick={() => handleTurfAction(turf._id, 'edit')}>Edit</button>
                                <button onClick={() => handleTurfAction(turf._id, 'delete')}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderBookings = () => (
        <div className="bookings-section">
            <h3>Booking Management</h3>
            <table>
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Turf</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map(booking => (
                        <tr key={booking._id}>
                            <td>{booking.user?.name}</td>
                            <td>{booking.turf?.name}</td>
                            <td>{new Date(booking.date).toLocaleDateString()}</td>
                            <td>{booking.status}</td>
                            <td>
                                <button onClick={() => handleBookingAction(booking._id, 'approve')}>Approve</button>
                                <button onClick={() => handleBookingAction(booking._id, 'cancel')}>Cancel</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="admin-dashboard">
            <div className="sidebar">
                <button 
                    className={activeTab === 'overview' ? 'active' : ''}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button 
                    className={activeTab === 'users' ? 'active' : ''}
                    onClick={() => setActiveTab('users')}
                >
                    Users
                </button>
                <button 
                    className={activeTab === 'turfs' ? 'active' : ''}
                    onClick={() => setActiveTab('turfs')}
                >
                    Turfs
                </button>
                <button 
                    className={activeTab === 'bookings' ? 'active' : ''}
                    onClick={() => setActiveTab('bookings')}
                >
                    Bookings
                </button>
            </div>
            <div className="main-content">
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <>
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'users' && renderUsers()}
                        {activeTab === 'turfs' && renderTurfs()}
                        {activeTab === 'bookings' && renderBookings()}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
