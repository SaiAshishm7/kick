import React, { useState } from 'react';
import axios from 'axios';
import './ReviewForm.css';

const ReviewForm = ({ turfId, bookingId, onReviewSubmitted }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                setError('Please login to submit a review');
                return;
            }

            const response = await axios.post(`http://localhost:5001/api/reviews/${turfId}/review`, {
                userId: user._id,
                userName: user.name,
                rating,
                comment,
                bookingId
            });

            setComment('');
            setRating(5);
            onReviewSubmitted(response.data);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="review-form-container">
            <h3>Write a Review</h3>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit} className="review-form">
                <div className="rating-container">
                    <label>Rating:</label>
                    <div className="star-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                onClick={() => setRating(star)}
                                style={{ cursor: 'pointer' }}
                            >
                                {star <= rating ? '★' : '☆'}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="comment-container">
                    <label>Comment:</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                        placeholder="Share your experience..."
                        rows="4"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={submitting || !comment.trim()}
                    className="submit-button"
                >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
            </form>
        </div>
    );
};

export default ReviewForm;
