// src/components/TurfDetails.js

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import BookingForm from './BookingForm';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import './TurfDetails.css';

const TurfDetails = () => {
    const { id } = useParams();
    const [turf, setTurf] = useState(null);
    const [reviews, setReviews] = useState({ reviews: [], averageRating: 0, totalReviews: 0 });

    // Fetch turf details
    useEffect(() => {
        const fetchTurfDetails = async () => {
            try {
                const res = await axios.get(`http://localhost:5001/api/turfs/${id}`);
                setTurf(res.data);
            } catch (err) {
                console.error('Error fetching turf details:', err);
            }
        };

        fetchTurfDetails();
    }, [id]);

    // Fetch reviews when turf data is available
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await axios.get(`http://localhost:5001/api/reviews/${id}/reviews`);
                setReviews(res.data);
            } catch (err) {
                console.error('Error fetching reviews:', err);
            }
        };

        if (turf) {
            fetchReviews();
        }
    }, [id, turf]);

    if (!turf) return <p>Loading turf details...</p>;

    const handleReviewSubmitted = (newReviewData) => {
        setReviews(prev => ({
            reviews: [newReviewData.review, ...prev.reviews],
            averageRating: newReviewData.averageRating,
            totalReviews: newReviewData.totalReviews
        }));
    };

    const handleReviewDeleted = (updatedData) => {
        setReviews({
            reviews: updatedData.reviews,
            averageRating: updatedData.averageRating,
            totalReviews: updatedData.totalReviews
        });
    };

    return (
        <div className="turf-details-container">
            <div className="turf-info">
                <h2>{turf.name}</h2>
                <div className="turf-meta">
                    <p><i className="fas fa-map-marker-alt"></i> {turf.location}</p>
                    <p><i className="fas fa-rupee-sign"></i> {turf.hourlyPrice}/hour</p>
                </div>
                {turf.description && (
                    <div className="turf-description">
                        <h3>About this turf</h3>
                        <p>{turf.description}</p>
                    </div>
                )}
                {turf.amenities && turf.amenities.length > 0 && (
                    <div className="turf-amenities">
                        <h3>Amenities</h3>
                        <ul>
                            {turf.amenities.map((amenity, index) => (
                                <li key={index}>{amenity}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="booking-section">
                <h3>Book this turf</h3>
                <BookingForm turfId={turf._id} />
            </div>

            <div className="reviews-section">
                <h3>Reviews and Ratings</h3>
                <ReviewList 
                    reviews={reviews.reviews}
                    averageRating={reviews.averageRating}
                    totalReviews={reviews.totalReviews}
                    turfId={turf._id}
                    onReviewDeleted={handleReviewDeleted}
                />
                <ReviewForm 
                    turfId={turf._id}
                    onReviewSubmitted={handleReviewSubmitted}
                />
            </div>
        </div>
    );
};

export default TurfDetails;
