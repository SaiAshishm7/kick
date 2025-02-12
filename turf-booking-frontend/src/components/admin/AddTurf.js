import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddTurf.css';

const AddTurf = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        hourlyPrice: '',
        description: '',
        amenities: '',
        images: []
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setFormData(prev => ({
            ...prev,
            images: files
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Create FormData object for file upload
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('location', formData.location);
            formDataToSend.append('hourlyPrice', formData.hourlyPrice);
            formDataToSend.append('description', formData.description);
            
            // Convert amenities string to array and remove empty items
            const amenitiesArray = formData.amenities
                .split(',')
                .map(item => item.trim())
                .filter(item => item !== '');
            formDataToSend.append('amenities', JSON.stringify(amenitiesArray));

            // Append each image
            formData.images.forEach(image => {
                formDataToSend.append('images', image);
            });

            await axios.post('http://localhost:5001/api/turfs', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Error adding turf');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-turf-container">
            <h2>Add New Turf</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="add-turf-form">
                <div className="form-group">
                    <label htmlFor="name">Turf Name *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter turf name"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="location">Location *</label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                        placeholder="Enter turf location"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="hourlyPrice">Hourly Price (₹) *</label>
                    <input
                        type="number"
                        id="hourlyPrice"
                        name="hourlyPrice"
                        value={formData.hourlyPrice}
                        onChange={handleChange}
                        required
                        min="0"
                        placeholder="Enter price per hour"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Enter turf description"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="amenities">Amenities (comma-separated)</label>
                    <input
                        type="text"
                        id="amenities"
                        name="amenities"
                        value={formData.amenities}
                        onChange={handleChange}
                        placeholder="e.g., Parking, Changing Room, Water"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="images">Images</label>
                    <input
                        type="file"
                        id="images"
                        name="images"
                        onChange={handleImageChange}
                        multiple
                        accept="image/*"
                    />
                    <small>You can select multiple images</small>
                </div>

                <div className="form-actions">
                    <button 
                        type="button" 
                        onClick={() => navigate('/admin/dashboard')}
                        className="cancel-btn"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Adding...' : 'Add Turf'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddTurf;
