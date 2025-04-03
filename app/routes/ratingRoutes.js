const express = require('express');
const router = express.Router();
const RatingController = require('../controllers/ratingController');
const auth = require('../middleware/auth');

// View user ratings
router.get('/user/:id', RatingController.getUserRatings);

// Rate a user (protected routes)
router.get('/rate/:id/:rideId', auth.verifyToken, RatingController.getRateUserForm);
router.post('/rate/:id/:rideId', auth.verifyToken, RatingController.postRateUser);

module.exports = router; 