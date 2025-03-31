const express = require('express');
const router = express.Router();
const RideController = require('../controllers/rideController');

// Rides listing route
router.get("/", RideController.getRidesList);

// Ride detail route
router.get("/:id", RideController.getRideDetail);

// Route to handle ride request submission
router.post("/:id/request", RideController.submitRideRequest);

// Routes to handle request acceptance/rejection
router.post("/:rideId/requests/:requestId/accept", RideController.acceptRideRequest);
router.post("/:rideId/requests/:requestId/reject", RideController.rejectRideRequest);

// Tags route
router.get("/tags", RideController.getTagsList);

module.exports = router; 