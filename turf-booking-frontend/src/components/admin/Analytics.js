import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Cell
} from 'recharts';
import './Analytics.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Analytics = () => {
    const [overallStats, setOverallStats] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [turfPerformance, setTurfPerformance] = useState([]);
    const [userAnalytics, setUserAnalytics] = useState(null);
    const [bookingAnalytics, setBookingAnalytics] = useState(null);
    const [period, setPeriod] = useState('daily');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [
                    overallResponse,
                    revenueResponse,
                    turfResponse,
                    userResponse,
                    bookingResponse
                ] = await Promise.all([
                    axios.get('/api/analytics/overall', { headers }),
                    axios.get(`/api/analytics/revenue?period=${period}`, { headers }),
                    axios.get('/api/analytics/turf-performance', { headers }),
                    axios.get('/api/analytics/user-analytics', { headers }),
                    axios.get('/api/analytics/booking-analytics', { headers })
                ]);

                setOverallStats(overallResponse.data);
                setRevenueData(revenueResponse.data);
                setTurfPerformance(turfResponse.data);
                setUserAnalytics(userResponse.data);
                setBookingAnalytics(bookingResponse.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [period]);

    if (loading) return <div className="loading">Loading analytics...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="analytics-dashboard">
            {/* Overall Statistics */}
            <div className="stats-cards">
                <div className="stat-card">
                    <h3>Total Bookings</h3>
                    <p>{overallStats?.totalBookings}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Revenue</h3>
                    <p>₹{overallStats?.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="stat-card">
                    <h3>Active Users</h3>
                    <p>{overallStats?.activeUsers}</p>
                </div>
                <div className="stat-card">
                    <h3>Pending Bookings</h3>
                    <p>{overallStats?.pendingBookings}</p>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="chart-container">
                <div className="chart-header">
                    <h3>Revenue Trends</h3>
                    <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="_id" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
                        <Line type="monotone" dataKey="bookings" stroke="#82ca9d" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Turf Performance */}
            <div className="chart-container">
                <h3>Turf Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={turfPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="turfName" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="totalRevenue" fill="#8884d8" />
                        <Bar dataKey="totalBookings" fill="#82ca9d" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* User Growth */}
            <div className="chart-container">
                <h3>User Growth</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={userAnalytics?.userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="_id" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#8884d8" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* User Status Distribution */}
            <div className="charts-row">
                <div className="chart-container half-width">
                    <h3>User Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={userAnalytics?.userStatus}
                                dataKey="count"
                                nameKey="_id"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {userAnalytics?.userStatus.map((entry, index) => (
                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container half-width">
                    <h3>Booking Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={bookingAnalytics?.bookingStatus}
                                dataKey="count"
                                nameKey="_id"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {bookingAnalytics?.bookingStatus.map((entry, index) => (
                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Customers Table */}
            <div className="table-container">
                <h3>Top Customers</h3>
                <table className="analytics-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Total Spent</th>
                            <th>Bookings</th>
                        </tr>
                    </thead>
                    <tbody>
                        {userAnalytics?.topCustomers.map((customer, index) => (
                            <tr key={index}>
                                <td>{customer.name}</td>
                                <td>{customer.email}</td>
                                <td>₹{customer.totalSpent.toLocaleString()}</td>
                                <td>{customer.bookingsCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Analytics;
