import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './EditTurf.css';

const EditTurf = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        hourlyPrice: '',
        description: '',
        amenities: '',
        images: []
    });
    const [currentImages, setCurrentImages] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchTurfData();
    }, [id]);

    const fetchTurfData = async () => {
        try {
            const response = await axios.get(`http://localhost:5001/api/turfs/${id}`);
            const turf = response.data;
            
            setFormData({
                name: turf.name,
                location: turf.location,
                hourlyPrice: turf.hourlyPrice,
                description: turf.description || '',
                amenities: turf.amenities ? turf.amenities.join(', ') : '',
                images: []
            });
            setCurrentImages(turf.images || []);
            setLoading(false);
        } catch (err) {
            setError('Error fetching turf data');
            setLoading(false);
        }
    };

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

    const handleRemoveImage = async (imageUrl) => {
        try {
            await axios.delete(`http://localhost:5001/api/turfs/${id}/images`, {
                data: { imageUrl }
            });
            setCurrentImages(prev => prev.filter(img => img !== imageUrl));
        } catch (err) {
            setError('Error removing image');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('location', formData.location);
            formDataToSend.append('hourlyPrice', formData.hourlyPrice);
            formDataToSend.append('description', formData.description);
            
            const amenitiesArray = formData.amenities
                .split(',')
                .map(item => item.trim())
                .filter(item => item !== '');
            formDataToSend.append('amenities', JSON.stringify(amenitiesArray));

            formData.images.forEach(image => {
                formDataToSend.append('images', image);
            });

            await axios.put(`http://localhost:5001/api/turfs/${id}`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Error updating turf');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="edit-turf-container">
            <h2>Edit Turf</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="edit-turf-form">
                <div className="form-group">
                    <label htmlFor="name">Turf Name *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
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
                    />
                </div>

                <div className="form-group">
                    <label>Current Images</label>
                    <div className="current-images">
                        {currentImages.map((image, index) => (
                            <div key={index} className="image-container">
                                <img src={image} alt={`Turf ${index + 1}`} />
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveImage(image)}
                                    className="remove-image-btn"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="images">Add New Images</label>
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
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditTurf;
