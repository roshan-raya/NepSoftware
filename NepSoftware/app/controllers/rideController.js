const RideModel = require('../models/rideModel');

class RideController {
    static async getRidesList(req, res) {
        try {
            const search = req.query.search || '';
            const tag = req.query.tag || '';
            const rides = await RideModel.getAllRides(search, tag);
            res.render('rides_list', { 
                title: 'Available Rides', 
                rides,
                search,
                tag
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error fetching rides");
        }
    }

    static async getRideDetail(req, res) {
        try {
            const rideId = parseInt(req.params.id, 10);
            const ride = await RideModel.getRideById(rideId);
            
            if (!ride) {
                return res.status(404).render('rides_detail', { 
                    title: 'Ride Not Found', 
                    ride: null 
                });
            }
            
            const requests = await RideModel.getRideRequests(rideId);
            
            res.render('rides_detail', { 
                title: `Ride Details: ${ride.pickup_location} to ${ride.dropoff_location}`,
                ride,
                requests
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error fetching ride details");
        }
    }

    static async submitRideRequest(req, res) {
        try {
            const rideId = parseInt(req.params.id, 10);
            const passengerId = req.session.userId; // Get the authenticated user's ID
            
            // Check if the ride exists and has available seats
            const ride = await RideModel.checkRideAvailability(rideId);
            if (!ride) {
                return res.status(404).send("Ride not found or no seats available");
            }
            
            // Check if the user already has a request for this ride
            const hasExistingRequest = await RideModel.checkExistingRequest(rideId, passengerId);
            if (hasExistingRequest) {
                return res.status(400).send("You already have a request for this ride");
            }
            
            // Create the new request
            await RideModel.createRideRequest(rideId, passengerId);
            
            res.redirect(`/rides/${rideId}`);
        } catch (error) {
            console.error(error);
            res.status(500).send("Error submitting ride request");
        }
    }

    static async acceptRideRequest(req, res) {
        try {
            const rideId = parseInt(req.params.rideId, 10);
            const requestId = parseInt(req.params.requestId, 10);
            
            // Update the request status
            await RideModel.updateRequestStatus(requestId, "accepted");
            
            // Decrease available seats
            await RideModel.updateRideSeats(rideId);
            
            res.redirect(`/rides/${rideId}`);
        } catch (error) {
            console.error(error);
            res.status(500).send("Error accepting ride request");
        }
    }

    static async rejectRideRequest(req, res) {
        try {
            const requestId = parseInt(req.params.requestId, 10);
            
            // Update the request status
            await RideModel.updateRequestStatus(requestId, "rejected");
            
            res.redirect(`/rides/${req.params.rideId}`);
        } catch (error) {
            console.error(error);
            res.status(500).send("Error rejecting ride request");
        }
    }

    static async getTagsList(req, res) {
        try {
            const tags = await RideModel.getTags();
            const selectedTag = req.query.tag;
            let taggedRides = [];
            
            if (selectedTag) {
                taggedRides = await RideModel.getRidesByTag(selectedTag);
            }
            
            res.render('tags_list', { 
                title: 'Tags & Categories', 
                tags, 
                selectedTag, 
                taggedRides 
            });
        } catch (error) {
            console.error('Error in /tags route:', error);
            console.error('Error stack:', error.stack);
            res.status(500).render('error', { 
                message: 'Error fetching tags', 
                error 
            });
        }
    }
}

module.exports = RideController; 