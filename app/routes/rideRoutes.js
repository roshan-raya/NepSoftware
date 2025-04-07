const express = require('express');
const router = express.Router();
const RideController = require('../controllers/rideController');

// Rides listing route
router.get("/", RideController.getRidesList);

// Ride creation route
router.get("/offer", RideController.showOfferRideForm);
router.post("/offer", RideController.createRide);

// Ride detail route
router.get("/:id", RideController.getRideDetail);

// Route to handle ride request submission
router.post("/:id/request", RideController.submitRideRequest);

// Routes to handle request acceptance/rejection
router.post("/:rideId/requests/:requestId/accept", RideController.acceptRideRequest);
router.post("/:rideId/requests/:requestId/reject", RideController.rejectRideRequest);

// Route to delete a ride
router.post("/:id/delete", RideController.deleteRide);

// Route to update ride status
router.post("/:id/status", RideController.updateRideStatus);

// Tags route
router.get("/tags", RideController.getTagsList);

// Categories route
router.get("/categories", RideController.getCategoriesList);

// Preferences route
router.get("/preferences", RideController.getPreferencesList);

module.exports = router; 