import React from 'react';
import axios from 'axios';
import './ReviewList.css';

const ReviewList = ({ reviews, averageRating, totalReviews, turfId, onReviewDeleted }) => {
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const renderStars = (rating) => {
        return '★'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    const handleDelete = async (reviewId) => {
        try {
            const response = await axios.delete(`http://localhost:5001/api/reviews/${turfId}/review/${reviewId}`);
            if (response.status === 200) {
                onReviewDeleted(response.data);
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('Failed to delete review. Please try again.');
        }
    };

    return (
        <div className="review-list-container">
            <div className="review-summary">
                <div className="average-rating">
                    <span className="rating-number">{averageRating}</span>
                    <div className="rating-stars">{renderStars(Math.round(averageRating))}</div>
                    <span className="total-reviews">Based on {totalReviews} reviews</span>
                </div>
            </div>

            <div className="reviews-container">
                {reviews.length === 0 ? (
                    <p className="no-reviews">No reviews yet. Be the first to review!</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review._id} className="review-item">
                            <div className="review-header">
                                <div className="reviewer-info">
                                    <span className="reviewer-name">{review.userName}</span>
                                    <span className="review-date">{formatDate(review.createdAt)}</span>
                                </div>
                                <div className="review-rating">
                                    {renderStars(review.rating)}
                                </div>
                            </div>
                            <div className="review-comment">
                                {review.comment}
                            </div>
                            <div className="review-actions">
                                <button 
                                    className="delete-review-btn"
                                    onClick={() => handleDelete(review._id)}
                                >
                                    Delete Review
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewList;
