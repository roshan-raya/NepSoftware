const express = require('express');
const router = express.Router();
const RideController = require('../controllers/rideController');
const auth = require('../middleware/auth');

// Apply authentication middleware that doesn't redirect
router.use(auth.isAuthenticated);

// Rides listing route (public)
router.get("/", RideController.getRidesList);

// Advanced search form
router.get("/search", RideController.getSearchRidesForm);

// Create ride routes (protected)
router.get("/create", auth.verifyToken, RideController.getCreateRideForm);
router.post("/create", auth.verifyToken, RideController.postCreateRide);

// Ride detail route (public)
router.get("/:id", RideController.getRideDetail);

// Route to handle ride request submission (protected)
router.post("/:id/request", auth.verifyToken, RideController.submitRideRequest);

// Routes to handle request acceptance/rejection (protected)
router.post("/:rideId/requests/:requestId/accept", auth.verifyToken, RideController.acceptRideRequest);
router.post("/:rideId/requests/:requestId/reject", auth.verifyToken, RideController.rejectRideRequest);

// Route to cancel a ride (protected - driver only)
router.post("/:id/cancel", auth.verifyToken, RideController.cancelRide);

// Route to cancel a request (protected - rider only)
router.post("/requests/:id/cancel", auth.verifyToken, RideController.cancelRequest);

// Tags route (public)
router.get("/tags", RideController.getTagsList);

module.exports = router; 