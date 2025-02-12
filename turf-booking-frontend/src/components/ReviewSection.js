// src/components/ReviewSection.js

import React, { useState } from 'react';
import axios from 'axios';

const ReviewSection = ({ turfId, reviews }) => {
    const [rating, setRating] = useState(1);
    const [comment, setComment] = useState('');
    const [message, setMessage] = useState('');

    const handleReview = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`http://localhost:5001/api/turfs/${turfId}/reviews`, {
                user: "Anonymous",  // Replace with logged-in user info later
                rating,
                comment
            });
            setMessage('Review submitted!');
        } catch (err) {
            console.error('Error submitting review:', err);
            setMessage('Failed to submit review.');
        }
    };

    return (
        <div style={{ marginTop: '30px' }}>
            <h3>Reviews</h3>
            {reviews.length > 0 ? (
                reviews.map((rev, index) => (
                    <div key={index} style={{ borderBottom: '1px solid #ccc', marginBottom: '10px' }}>
                        <p><strong>{rev.user}</strong> rated {rev.rating}/5</p>
                        <p>{rev.comment}</p>
                    </div>
                ))
            ) : (
                <p>No reviews yet.</p>
            )}

            <form onSubmit={handleReview}>
                <label>Rating (1-5):</label><br />
                <input type="number" min="1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} required /><br /><br />

                <label>Comment:</label><br />
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} required></textarea><br /><br />

                <button type="submit">Submit Review</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default ReviewSection;
