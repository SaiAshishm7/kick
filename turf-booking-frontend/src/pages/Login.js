// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear error when user types
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Try admin login first if email looks like admin email
            if (formData.email.includes('admin')) {
                try {
                    console.log('Attempting admin login...');
                    const adminResponse = await axios.post('http://localhost:5001/api/auth/admin/login', {
                        email: formData.email,
                        password: formData.password
                    });
                    console.log('Admin login response:', adminResponse.data);

                    if (adminResponse.data.token) {
                        // Store admin token and data
                        localStorage.setItem('token', adminResponse.data.token);
                        localStorage.setItem('user', JSON.stringify({ ...adminResponse.data.admin, isAdmin: true }));
                        axios.defaults.headers.common['Authorization'] = `Bearer ${adminResponse.data.token}`;
                        navigate('/admin');
                        return;
                    }
                } catch (adminError) {
                    console.log('Admin login failed:', adminError.response?.data);
                    if (adminError.response?.status === 400) {
                        setError(adminError.response.data.message);
                        setLoading(false);
                        return;
                    }
                }
            }

            // If not admin email or admin login fails without 400, try user login
            const userResponse = await axios.post('http://localhost:5001/api/auth/user/login', {
                email: formData.email,
                password: formData.password
            });
            console.log('User login response:', userResponse.data);

            if (userResponse.data.token) {
                // Store user token and data
                localStorage.setItem('token', userResponse.data.token);
                localStorage.setItem('user', JSON.stringify(userResponse.data.user));
                axios.defaults.headers.common['Authorization'] = `Bearer ${userResponse.data.token}`;
                navigate('/dashboard');
            } else {
                setError('Login successful but no token received');
            }
        } catch (error) {
            console.error('Login error:', error);
            
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error response:', error.response.data);
                setError(error.response.data.message || 'Login failed. Please check your credentials.');
            } else if (error.request) {
                // The request was made but no response was received
                console.error('Error request:', error.request);
                setError('No response from server. Please try again.');
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error message:', error.message);
                setError('An error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Welcome Back!</h2>
                <p className="subtitle">Login to your kickNclick account</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={`login-button ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Don't have an account? <Link to="/register">Sign up</Link></p>
                    <Link to="/forgot-password" className="forgot-password">
                        Forgot Password?
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
