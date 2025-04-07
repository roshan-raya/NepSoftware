const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');
const { isAuthenticated } = require('../middleware/auth');

// Get reviews for a specific user
router.get('/user/:id', isAuthenticated, ReviewController.getReviewsForUser);

// Get reviews by a specific user
router.get('/by-user/:id', isAuthenticated, ReviewController.getReviewsByUser);

// Form to create a review for a user on a specific ride
router.get('/create/:rideId/:userId/:type', isAuthenticated, ReviewController.showCreateReviewForm);

// Submit a review
router.post('/create/:rideId/:userId/:type', isAuthenticated, ReviewController.submitReview);

// Delete a review
router.post('/delete/:id', isAuthenticated, ReviewController.deleteReview);

module.exports = router; 