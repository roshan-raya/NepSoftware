const db = require('../services/db');
const UserModel = require('../models/userModel');

class RatingController {
    // Get ratings for a user
    static async getUserRatings(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            const user = await UserModel.getUserById(userId);
            
            if (!user) {
                return res.status(404).render('error', { 
                    message: 'User not found',
                    error: { status: 404 }
                });
            }
            
            const sql = `
                SELECT r.*, u.name as rater_name, rides.pickup_location
                FROM Ratings r
                JOIN Users u ON r.rater_id = u.id
                JOIN Rides rides ON r.ride_id = rides.id
                WHERE r.rated_id = ?
                ORDER BY r.created_at DESC
            `;
            
            const ratings = await db.query(sql, [userId]);
            
            // Calculate average rating
            let averageRating = 0;
            if (ratings.length > 0) {
                const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
                averageRating = (sum / ratings.length).toFixed(1);
            }
            
            res.render('ratings/user_ratings', {
                title: `${user.name}'s Ratings`,
                user,
                ratings,
                averageRating
            });
            
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error fetching ratings',
                error: { status: 500 }
            });
        }
    }
    
    // Get form to rate a user
    static async getRateUserForm(req, res) {
        try {
            const ratedId = parseInt(req.params.id, 10);
            const rideId = parseInt(req.params.rideId, 10);
            
            // Check if rated user exists
            const ratedUser = await UserModel.getUserById(ratedId);
            
            if (!ratedUser) {
                return res.status(404).render('error', {
                    message: 'User not found',
                    error: { status: 404 }
                });
            }
            
            // Check if ride exists and is valid
            const rideSql = 'SELECT * FROM Rides WHERE id = ?';
            const [ride] = await db.query(rideSql, [rideId]);
            
            if (!ride) {
                return res.status(404).render('error', {
                    message: 'Ride not found',
                    error: { status: 404 }
                });
            }
            
            // Check if user participated in ride
            const participantSql = `
                SELECT * FROM Ride_Requests 
                WHERE ride_id = ? AND passenger_id = ? AND status = 'accepted'
            `;
            
            const rideRequests = await db.query(participantSql, [rideId, req.user.id]);
            const isDriver = ride.driver_id === req.user.id;
            
            if (!isDriver && rideRequests.length === 0) {
                return res.status(403).render('error', {
                    message: 'You cannot rate a user for a ride you did not participate in',
                    error: { status: 403 }
                });
            }
            
            // Check if already rated
            const checkRatingSql = `
                SELECT * FROM Ratings 
                WHERE ride_id = ? AND rater_id = ? AND rated_id = ?
            `;
            
            const existingRatings = await db.query(checkRatingSql, [rideId, req.user.id, ratedId]);
            
            if (existingRatings.length > 0) {
                return res.render('ratings/already_rated', {
                    title: 'Already Rated',
                    ratedUser,
                    ride
                });
            }
            
            res.render('ratings/rate_user', {
                title: `Rate ${ratedUser.name}`,
                ratedUser,
                ride
            });
            
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error loading rating form',
                error: { status: 500 }
            });
        }
    }
    
    // Process user rating submission
    static async postRateUser(req, res) {
        try {
            const ratedId = parseInt(req.params.id, 10);
            const rideId = parseInt(req.params.rideId, 10);
            const { rating, comment } = req.body;
            
            // Validate rating
            const ratingValue = parseInt(rating, 10);
            if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
                return res.status(400).render('error', {
                    message: 'Invalid rating value',
                    error: { status: 400 }
                });
            }
            
            // Insert rating
            const sql = `
                INSERT INTO Ratings (ride_id, rater_id, rated_id, rating, comment)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            await db.query(sql, [rideId, req.user.id, ratedId, ratingValue, comment || null]);
            
            // Redirect to user's ratings page
            res.redirect(`/ratings/user/${ratedId}`);
            
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error submitting rating',
                error: { status: 500 }
            });
        }
    }
}

module.exports = RatingController; 