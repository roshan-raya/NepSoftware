const db = require('../services/db');

class ReviewModel {
    static async createReview(reviewerUserId, revieweeUserId, rideId, rating, reviewText, reviewType) {
        try {
            // Check if this review already exists
            const checkSql = `
                SELECT id FROM Reviews 
                WHERE reviewer_id = ? AND reviewee_id = ? AND ride_id = ? AND review_type = ?
            `;
            const existingReviews = await db.query(checkSql, [reviewerUserId, revieweeUserId, rideId, reviewType]);
            
            if (existingReviews.length > 0) {
                // Update existing review
                const sql = `
                    UPDATE Reviews 
                    SET rating = ?, review_text = ?, created_at = NOW() 
                    WHERE reviewer_id = ? AND reviewee_id = ? AND ride_id = ? AND review_type = ?
                `;
                await db.query(sql, [rating, reviewText, reviewerUserId, revieweeUserId, rideId, reviewType]);
                return { id: existingReviews[0].id, updated: true };
            } else {
                // Create new review
                const sql = `
                    INSERT INTO Reviews (reviewer_id, reviewee_id, ride_id, rating, review_text, review_type)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                const result = await db.query(sql, [reviewerUserId, revieweeUserId, rideId, rating, reviewText, reviewType]);
                
                // Log this activity
                const activitySql = `
                    INSERT INTO UserActivity (user_id, activity_type, activity_data)
                    VALUES (?, 'review_posted', ?)
                `;
                const activityData = JSON.stringify({
                    reviewee_id: revieweeUserId,
                    ride_id: rideId,
                    review_type: reviewType
                });
                await db.query(activitySql, [reviewerUserId, activityData]);
                
                // Update user rating
                await this.updateUserRating(revieweeUserId, reviewType);
                
                return { id: result.insertId, updated: false };
            }
        } catch (error) {
            console.error('Error in createReview:', error);
            throw error;
        }
    }
    
    static async updateUserRating(userId, reviewType) {
        try {
            const sql = `
                UPDATE Users
                SET ${reviewType}_rating = (
                    SELECT COALESCE(AVG(rating), 0)
                    FROM Reviews
                    WHERE reviewee_id = ? AND review_type = ?
                )
                WHERE id = ?
            `;
            await db.query(sql, [userId, reviewType, userId]);
        } catch (error) {
            console.error('Error in updateUserRating:', error);
            throw error;
        }
    }
    
    static async getReviewsForUser(userId, reviewType = null) {
        try {
            let sql = `
                SELECT r.*, 
                       u.name as reviewer_name, 
                       u.profile_photo as reviewer_photo,
                       rides.departure_time, 
                       rides.pickup_location
                FROM Reviews r
                JOIN Users u ON r.reviewer_id = u.id
                JOIN Rides rides ON r.ride_id = rides.id
                WHERE r.reviewee_id = ?
            `;
            
            const params = [userId];
            
            if (reviewType) {
                sql += ' AND r.review_type = ?';
                params.push(reviewType);
            }
            
            sql += ' ORDER BY r.created_at DESC';
            
            return await db.query(sql, params);
        } catch (error) {
            console.error('Error in getReviewsForUser:', error);
            throw error;
        }
    }
    
    static async getReviewsByUser(userId) {
        try {
            const sql = `
                SELECT r.*, 
                       u.name as reviewee_name, 
                       u.profile_photo as reviewee_photo,
                       rides.departure_time, 
                       rides.pickup_location
                FROM Reviews r
                JOIN Users u ON r.reviewee_id = u.id
                JOIN Rides rides ON r.ride_id = rides.id
                WHERE r.reviewer_id = ?
                ORDER BY r.created_at DESC
            `;
            
            return await db.query(sql, [userId]);
        } catch (error) {
            console.error('Error in getReviewsByUser:', error);
            throw error;
        }
    }
    
    static async getReviewForRide(rideId, reviewerId, revieweeId, reviewType) {
        try {
            const sql = `
                SELECT * FROM Reviews
                WHERE ride_id = ? AND reviewer_id = ? AND reviewee_id = ? AND review_type = ?
            `;
            
            const reviews = await db.query(sql, [rideId, reviewerId, revieweeId, reviewType]);
            return reviews.length > 0 ? reviews[0] : null;
        } catch (error) {
            console.error('Error in getReviewForRide:', error);
            throw error;
        }
    }
    
    static async deleteReview(reviewId, userId) {
        try {
            // First verify the reviewer is the one deleting
            const checkSql = 'SELECT reviewer_id, reviewee_id, review_type FROM Reviews WHERE id = ?';
            const [review] = await db.query(checkSql, [reviewId]);
            
            if (!review) {
                throw new Error('Review not found');
            }
            
            if (review.reviewer_id !== userId) {
                throw new Error('Only the reviewer can delete this review');
            }
            
            // Delete the review
            const sql = 'DELETE FROM Reviews WHERE id = ?';
            await db.query(sql, [reviewId]);
            
            // Update the user rating
            await this.updateUserRating(review.reviewee_id, review.review_type);
            
            return true;
        } catch (error) {
            console.error('Error in deleteReview:', error);
            throw error;
        }
    }
}

module.exports = ReviewModel; 