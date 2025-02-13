import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserProfile.css';

const UserProfile = () => {
    const [profile, setProfile] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        address: '',
        preferences: {
            emailNotifications: true,
            smsNotifications: false,
            language: 'en'
        }
    });

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [profileRes, bookingsRes, notificationsRes] = await Promise.all([
                axios.get('/api/users/profile', { headers }),
                axios.get('/api/users/bookings', { headers }),
                axios.get('/api/users/notifications', { headers })
            ]);

            setProfile(profileRes.data);
            setFormData({
                name: profileRes.data.name,
                email: profileRes.data.email,
                phoneNumber: profileRes.data.phoneNumber || '',
                address: profileRes.data.address || '',
                preferences: profileRes.data.preferences
            });
            setBookings(bookingsRes.data);
            setNotifications(notificationsRes.data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePreferenceChange = (e) => {
        const { name, checked, value } = e.target;
        setFormData(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                [name]: e.target.type === 'checkbox' ? checked : value
            }
        }));
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            await axios.put('/api/users/profile', formData, { headers });
            setProfile({ ...profile, ...formData });
            setEditMode(false);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleProfilePicture = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            const token = localStorage.getItem('token');
            const headers = { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            };

            const response = await axios.post('/api/users/profile-picture', formData, { headers });
            setProfile(prev => ({ ...prev, profilePicture: response.data.profilePicture }));
        } catch (err) {
            setError(err.message);
        }
    };

    const markNotificationAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            await axios.put(`/api/users/notifications/${notificationId}`, { read: true }, { headers });
            setNotifications(prev =>
                prev.map(notification =>
                    notification._id === notificationId
                        ? { ...notification, read: true }
                        : notification
                )
            );
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="loading">Loading profile...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="user-profile">
            <div className="profile-header">
                <div className="profile-picture">
                    <img
                        src={profile.profilePicture || '/default-avatar.png'}
                        alt={profile.name}
                    />
                    <input
                        type="file"
                        id="profile-picture-input"
                        accept="image/*"
                        onChange={handleProfilePicture}
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="profile-picture-input" className="change-picture-btn">
                        Change Picture
                    </label>
                </div>
                <div className="profile-info">
                    <h2>{profile.name}</h2>
                    <p>{profile.email}</p>
                </div>
            </div>

            <div className="profile-tabs">
                <button
                    className={activeTab === 'profile' ? 'active' : ''}
                    onClick={() => setActiveTab('profile')}
                >
                    Profile
                </button>
                <button
                    className={activeTab === 'bookings' ? 'active' : ''}
                    onClick={() => setActiveTab('bookings')}
                >
                    Bookings
                </button>
                <button
                    className={activeTab === 'notifications' ? 'active' : ''}
                    onClick={() => setActiveTab('notifications')}
                >
                    Notifications
                    {notifications.filter(n => !n.read).length > 0 && (
                        <span className="notification-badge">
                            {notifications.filter(n => !n.read).length}
                        </span>
                    )}
                </button>
            </div>

            <div className="profile-content">
                {activeTab === 'profile' && (
                    <div className="profile-section">
                        {editMode ? (
                            <form onSubmit={handleProfileUpdate}>
                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Address</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="preferences-section">
                                    <h3>Preferences</h3>
                                    <div className="form-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                name="emailNotifications"
                                                checked={formData.preferences.emailNotifications}
                                                onChange={handlePreferenceChange}
                                            />
                                            Email Notifications
                                        </label>
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                name="smsNotifications"
                                                checked={formData.preferences.smsNotifications}
                                                onChange={handlePreferenceChange}
                                            />
                                            SMS Notifications
                                        </label>
                                    </div>
                                    <div className="form-group">
                                        <label>Language</label>
                                        <select
                                            name="language"
                                            value={formData.preferences.language}
                                            onChange={handlePreferenceChange}
                                        >
                                            <option value="en">English</option>
                                            <option value="hi">Hindi</option>
                                            <option value="te">Telugu</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" onClick={() => setEditMode(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="primary">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="profile-details">
                                <button
                                    className="edit-profile-btn"
                                    onClick={() => setEditMode(true)}
                                >
                                    Edit Profile
                                </button>
                                <div className="detail-group">
                                    <label>Name</label>
                                    <p>{profile.name}</p>
                                </div>
                                <div className="detail-group">
                                    <label>Email</label>
                                    <p>{profile.email}</p>
                                </div>
                                <div className="detail-group">
                                    <label>Phone Number</label>
                                    <p>{profile.phoneNumber || 'Not provided'}</p>
                                </div>
                                <div className="detail-group">
                                    <label>Address</label>
                                    <p>{profile.address || 'Not provided'}</p>
                                </div>
                                <div className="preferences-section">
                                    <h3>Preferences</h3>
                                    <div className="detail-group">
                                        <label>Email Notifications</label>
                                        <p>{profile.preferences.emailNotifications ? 'Enabled' : 'Disabled'}</p>
                                    </div>
                                    <div className="detail-group">
                                        <label>SMS Notifications</label>
                                        <p>{profile.preferences.smsNotifications ? 'Enabled' : 'Disabled'}</p>
                                    </div>
                                    <div className="detail-group">
                                        <label>Language</label>
                                        <p>{profile.preferences.language.toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'bookings' && (
                    <div className="bookings-section">
                        {bookings.length === 0 ? (
                            <p className="no-data">No bookings yet</p>
                        ) : (
                            <div className="bookings-list">
                                {bookings.map(booking => (
                                    <div key={booking._id} className="booking-card">
                                        <div className="booking-header">
                                            <h3>{booking.turf.name}</h3>
                                            <span className={`status ${booking.status.toLowerCase()}`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="booking-details">
                                            <p>
                                                <strong>Date:</strong>{' '}
                                                {new Date(booking.bookingDate).toLocaleDateString()}
                                            </p>
                                            <p>
                                                <strong>Time:</strong> {booking.timeSlot}
                                            </p>
                                            <p>
                                                <strong>Amount:</strong> ₹{booking.totalAmount}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="notifications-section">
                        {notifications.length === 0 ? (
                            <p className="no-data">No notifications</p>
                        ) : (
                            <div className="notifications-list">
                                {notifications.map(notification => (
                                    <div
                                        key={notification._id}
                                        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                        onClick={() => !notification.read && markNotificationAsRead(notification._id)}
                                    >
                                        <div className="notification-content">
                                            <p>{notification.message}</p>
                                            <span className="notification-time">
                                                {new Date(notification.date).toLocaleString()}
                                            </span>
                                        </div>
                                        {!notification.read && (
                                            <span className="unread-indicator" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
