import React, { useState } from 'react';
import './TurfSearch.css';

const TurfSearch = ({ onSearch }) => {
    const [filters, setFilters] = useState({
        search: '',
        location: '',
        priceRange: '',
        rating: '',
        amenities: []
    });

    const amenitiesList = [
        'Parking',
        'Changing Room',
        'Water',
        'Floodlights',
        'Equipment Rental',
        'Refreshments',
        'First Aid',
        'Seating Area'
    ];

    const priceRanges = [
        { label: 'Any Price', value: '' },
        { label: 'Under ₹500', value: '0-500' },
        { label: '₹500 - ₹1000', value: '500-1000' },
        { label: '₹1000 - ₹1500', value: '1000-1500' },
        { label: 'Above ₹1500', value: '1500+' }
    ];

    const ratings = [
        { label: 'Any Rating', value: '' },
        { label: '4+ Stars', value: '4' },
        { label: '3+ Stars', value: '3' },
        { label: '2+ Stars', value: '2' }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAmenityToggle = (amenity) => {
        setFilters(prev => {
            const newAmenities = prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity];
            
            return {
                ...prev,
                amenities: newAmenities
            };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(filters);
    };

    const handleClear = () => {
        setFilters({
            search: '',
            location: '',
            priceRange: '',
            rating: '',
            amenities: []
        });
        onSearch({
            search: '',
            location: '',
            priceRange: '',
            rating: '',
            amenities: []
        });
    };

    return (
        <div className="turf-search">
            <form onSubmit={handleSubmit} className="search-form">
                <div className="search-row">
                    <div className="search-group">
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleInputChange}
                            placeholder="Search turfs..."
                            className="search-input"
                        />
                    </div>

                    <div className="search-group">
                        <input
                            type="text"
                            name="location"
                            value={filters.location}
                            onChange={handleInputChange}
                            placeholder="Location"
                            className="location-input"
                        />
                    </div>

                    <div className="search-group">
                        <select
                            name="priceRange"
                            value={filters.priceRange}
                            onChange={handleInputChange}
                            className="price-select"
                        >
                            {priceRanges.map(range => (
                                <option key={range.value} value={range.value}>
                                    {range.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="search-group">
                        <select
                            name="rating"
                            value={filters.rating}
                            onChange={handleInputChange}
                            className="rating-select"
                        >
                            {ratings.map(rating => (
                                <option key={rating.value} value={rating.value}>
                                    {rating.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="amenities-section">
                    <h4>Amenities</h4>
                    <div className="amenities-grid">
                        {amenitiesList.map(amenity => (
                            <label key={amenity} className="amenity-checkbox">
                                <input
                                    type="checkbox"
                                    checked={filters.amenities.includes(amenity)}
                                    onChange={() => handleAmenityToggle(amenity)}
                                />
                                {amenity}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="search-actions">
                    <button type="button" onClick={handleClear} className="clear-btn">
                        Clear Filters
                    </button>
                    <button type="submit" className="search-btn">
                        Search
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TurfSearch;
