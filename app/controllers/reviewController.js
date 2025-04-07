const ReviewModel = require('../models/reviewModel');
const UserModel = require('../models/userModel');
const RideModel = require('../models/rideModel');

class ReviewController {
    static async getReviewsForUser(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            const reviewType = req.query.type; // Optional: 'driver' or 'passenger'
            
            // Get user information
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).render('error', { 
                    message: 'User not found' 
                });
            }
            
            // Get reviews for this user
            const reviews = await ReviewModel.getReviewsForUser(userId, reviewType);
            
            res.render('user_reviews', {
                title: `Reviews for ${user.name}`,
                user,
                reviews,
                reviewType
            });
        } catch (error) {
            console.error('Error in getReviewsForUser:', error);
            res.status(500).render('error', { 
                message: 'Error fetching reviews', 
                error 
            });
        }
    }
    
    static async getReviewsByUser(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            
            // Get user information
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).render('error', { 
                    message: 'User not found' 
                });
            }
            
            // Get reviews by this user
            const reviews = await ReviewModel.getReviewsByUser(userId);
            
            res.render('reviews_by_user', {
                title: `Reviews by ${user.name}`,
                user,
                reviews
            });
        } catch (error) {
            console.error('Error in getReviewsByUser:', error);
            res.status(500).render('error', { 
                message: 'Error fetching reviews', 
                error 
            });
        }
    }
    
    static async showCreateReviewForm(req, res) {
        try {
            const rideId = parseInt(req.params.rideId, 10);
            const revieweeId = parseInt(req.params.userId, 10);
            const reviewType = req.params.type; // 'driver' or 'passenger'
            
            // Validate review type
            if (reviewType !== 'driver' && reviewType !== 'passenger') {
                return res.status(400).render('error', { 
                    message: 'Invalid review type' 
                });
            }
            
            // Get ride and user information
            const ride = await RideModel.getRideById(rideId);
            const reviewee = await UserModel.findById(revieweeId);
            
            if (!ride || !reviewee) {
                return res.status(404).render('error', { 
                    message: 'Ride or user not found' 
                });
            }
            
            // Check if the current user is allowed to review this user for this ride
            const currentUserId = req.session.userId;
            if (reviewType === 'driver' && ride.driver_id !== revieweeId) {
                return res.status(403).render('error', { 
                    message: 'This user is not the driver of this ride' 
                });
            }
            
            // Check if the user has already submitted a review
            const existingReview = await ReviewModel.getReviewForRide(rideId, currentUserId, revieweeId, reviewType);
            
            res.render('create_review', {
                title: `Review ${reviewType === 'driver' ? 'Driver' : 'Passenger'}`,
                ride,
                reviewee,
                reviewType,
                existingReview
            });
        } catch (error) {
            console.error('Error in showCreateReviewForm:', error);
            res.status(500).render('error', { 
                message: 'Error loading review form', 
                error 
            });
        }
    }
    
    static async submitReview(req, res) {
        try {
            const rideId = parseInt(req.params.rideId, 10);
            const revieweeId = parseInt(req.params.userId, 10);
            const reviewType = req.params.type; // 'driver' or 'passenger'
            const reviewerId = req.session.userId;
            
            const { rating, reviewText } = req.body;
            
            // Validate inputs
            if (!rating || isNaN(parseInt(rating, 10)) || parseInt(rating, 10) < 1 || parseInt(rating, 10) > 5) {
                return res.status(400).render('error', { 
                    message: 'Invalid rating. Please provide a rating between 1 and 5.' 
                });
            }
            
            // Create or update the review
            await ReviewModel.createReview(
                reviewerId,
                revieweeId,
                rideId,
                parseInt(rating, 10),
                reviewText || '',
                reviewType
            );
            
            // Redirect to the ride detail page
            res.redirect(`/rides/${rideId}`);
        } catch (error) {
            console.error('Error in submitReview:', error);
            res.status(500).render('error', { 
                message: 'Error submitting review', 
                error 
            });
        }
    }
    
    static async deleteReview(req, res) {
        try {
            const reviewId = parseInt(req.params.id, 10);
            const userId = req.session.userId;
            
            // Delete the review
            await ReviewModel.deleteReview(reviewId, userId);
            
            // Redirect to the user's profile or back to where they came from
            const referer = req.headers.referer || `/users/${userId}`;
            res.redirect(referer);
        } catch (error) {
            console.error('Error in deleteReview:', error);
            res.status(500).render('error', { 
                message: 'Error deleting review', 
                error 
            });
        }
    }
}

module.exports = ReviewController; 