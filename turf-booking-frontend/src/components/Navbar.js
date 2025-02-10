// src/components/Navbar.js

import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav style={{ padding: '10px', backgroundColor: '#333', color: '#fff' }}>
            <Link to="/" style={{ margin: '0 10px', color: '#fff' }}>Home</Link>
            <Link to="/profile" style={{ margin: '0 10px', color: '#fff' }}>Profile</Link>
            <Link to="/admin" style={{ margin: '0 10px', color: '#fff' }}>Admin</Link>
            <Link to="/login" style={{ margin: '0 10px', color: '#fff' }}>Login</Link>
        </nav>
    );
};

export default Navbar;
