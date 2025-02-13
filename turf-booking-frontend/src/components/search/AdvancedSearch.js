import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import axios from 'axios';
import './AdvancedSearch.css';

const libraries = ['places'];
const mapContainerStyle = {
    width: '100%',
    height: '400px'
};

const AdvancedSearch = () => {
    const [filters, setFilters] = useState({
        search: '',
        location: '',
        date: '',
        timeSlot: '',
        minPrice: '',
        maxPrice: '',
        rating: '',
        amenities: [],
        sort: 'rating:desc'
    });

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedTurf, setSelectedTurf] = useState(null);
    const [mapCenter, setMapCenter] = useState({ lat: 17.385044, lng: 78.486671 }); // Default to Hyderabad

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

    const timeSlots = Array.from({ length: 14 }, (_, i) => {
        const hour = i + 6; // Start from 6 AM
        return `${hour.toString().padStart(2, '0')}:00`;
    });

    useEffect(() => {
        // Get user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(location);
                    setMapCenter(location);
                },
                (error) => {
                    console.error('Error getting location:', error);
                }
            );
        }
    }, []);

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
            return { ...prev, amenities: newAmenities };
        });
    };

    const handleSearch = async () => {
        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams({
                ...filters,
                amenities: filters.amenities.join(','),
                lat: userLocation?.lat,
                lng: userLocation?.lng
            });

            const response = await axios.get(`/api/search/turfs?${queryParams}`);
            setResults(response.data);

            // Update map center to first result if available
            if (response.data.length > 0 && response.data[0].location?.coordinates) {
                setMapCenter({
                    lat: response.data[0].location.coordinates[1],
                    lng: response.data[0].location.coordinates[0]
                });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMapClick = useCallback(() => {
        setSelectedTurf(null);
    }, []);

    return (
        <div className="advanced-search">
            <div className="search-filters">
                <div className="search-row">
                    <input
                        type="text"
                        name="search"
                        value={filters.search}
                        onChange={handleInputChange}
                        placeholder="Search turfs..."
                        className="search-input"
                    />

                    <input
                        type="text"
                        name="location"
                        value={filters.location}
                        onChange={handleInputChange}
                        placeholder="Location"
                        className="location-input"
                    />

                    <input
                        type="date"
                        name="date"
                        value={filters.date}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="date-input"
                    />

                    <select
                        name="timeSlot"
                        value={filters.timeSlot}
                        onChange={handleInputChange}
                        className="time-select"
                    >
                        <option value="">Select Time</option>
                        {timeSlots.map(slot => (
                            <option key={slot} value={slot}>{slot}</option>
                        ))}
                    </select>
                </div>

                <div className="search-row">
                    <input
                        type="number"
                        name="minPrice"
                        value={filters.minPrice}
                        onChange={handleInputChange}
                        placeholder="Min Price"
                        className="price-input"
                    />

                    <input
                        type="number"
                        name="maxPrice"
                        value={filters.maxPrice}
                        onChange={handleInputChange}
                        placeholder="Max Price"
                        className="price-input"
                    />

                    <select
                        name="rating"
                        value={filters.rating}
                        onChange={handleInputChange}
                        className="rating-select"
                    >
                        <option value="">Any Rating</option>
                        <option value="4">4+ Stars</option>
                        <option value="3">3+ Stars</option>
                        <option value="2">2+ Stars</option>
                    </select>

                    <select
                        name="sort"
                        value={filters.sort}
                        onChange={handleInputChange}
                        className="sort-select"
                    >
                        <option value="rating:desc">Highest Rated</option>
                        <option value="pricePerHour:asc">Price: Low to High</option>
                        <option value="pricePerHour:desc">Price: High to Low</option>
                        <option value="distance:asc">Nearest First</option>
                    </select>
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

                <button onClick={handleSearch} className="search-button">
                    Search
                </button>
            </div>

            <div className="search-results">
                <div className="map-view">
                    <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY" libraries={libraries}>
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={mapCenter}
                            zoom={12}
                            onClick={handleMapClick}
                        >
                            {results.map(turf => (
                                <Marker
                                    key={turf._id}
                                    position={{
                                        lat: turf.location.coordinates[1],
                                        lng: turf.location.coordinates[0]
                                    }}
                                    onClick={() => setSelectedTurf(turf)}
                                />
                            ))}

                            {selectedTurf && (
                                <InfoWindow
                                    position={{
                                        lat: selectedTurf.location.coordinates[1],
                                        lng: selectedTurf.location.coordinates[0]
                                    }}
                                    onCloseClick={() => setSelectedTurf(null)}
                                >
                                    <div className="info-window">
                                        <h3>{selectedTurf.name}</h3>
                                        <p>{selectedTurf.location.address}</p>
                                        <p>₹{selectedTurf.pricePerHour}/hour</p>
                                        <p>Rating: {selectedTurf.averageRating.toFixed(1)} ⭐</p>
                                    </div>
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    </LoadScript>
                </div>

                <div className="results-list">
                    {loading && <div className="loading">Searching...</div>}
                    {error && <div className="error">Error: {error}</div>}
                    
                    {!loading && !error && results.length === 0 && (
                        <div className="no-results">No turfs found matching your criteria</div>
                    )}

                    {results.map(turf => (
                        <div key={turf._id} className="turf-card">
                            <img src={turf.images[0]} alt={turf.name} className="turf-image" />
                            <div className="turf-info">
                                <h3>{turf.name}</h3>
                                <p className="location">{turf.location.address}</p>
                                <div className="turf-details">
                                    <span className="price">₹{turf.pricePerHour}/hour</span>
                                    <span className="rating">
                                        {turf.averageRating.toFixed(1)} ⭐
                                    </span>
                                </div>
                                {turf.distance && (
                                    <p className="distance">
                                        {turf.distance.toFixed(1)} km away
                                    </p>
                                )}
                                <div className="turf-amenities">
                                    {turf.amenities.slice(0, 3).map(amenity => (
                                        <span key={amenity} className="amenity-tag">
                                            {amenity}
                                        </span>
                                    ))}
                                    {turf.amenities.length > 3 && (
                                        <span className="amenity-tag more">
                                            +{turf.amenities.length - 3} more
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => window.location.href = `/turf/${turf._id}`}
                                    className="view-details-btn"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdvancedSearch;
