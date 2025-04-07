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

    static async showOfferRideForm(req, res) {
        try {
            // Get any needed data for the form (like available tags)
            const tags = await RideModel.getTags();
            
            res.render('offer_ride', { 
                title: 'Offer a Ride',
                tags
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error loading offer ride form");
        }
    }

    static async createRide(req, res) {
        try {
            const driverId = req.session.userId; // Get the authenticated user's ID
            const { departureDatetime, pickupLocation, seatsAvailable, tags } = req.body;
            
            // Validate the input
            if (!departureDatetime || !pickupLocation || !seatsAvailable) {
                return res.status(400).render('offer_ride', {
                    title: 'Offer a Ride',
                    error: 'Please fill all required fields',
                    formData: req.body
                });
            }
            
            // Create the new ride
            const rideId = await RideModel.createRide({
                driverId,
                departureDatetime,
                pickupLocation,
                seatsAvailable: parseInt(seatsAvailable, 10),
                tags
            });
            
            // Redirect to the new ride's detail page
            res.redirect(`/rides/${rideId}`);
        } catch (error) {
            console.error(error);
            res.status(500).render('offer_ride', {
                title: 'Offer a Ride',
                error: 'Error creating ride',
                formData: req.body
            });
        }
    }

    static async submitRideRequest(req, res) {
        try {
            const rideId = parseInt(req.params.id, 10);
            const passengerId = req.session.userId; // Get the authenticated user's ID
            const message = req.body.message || ''; // Get the message from the form
            
            // Get ride details to check if user is the driver
            const ride = await RideModel.getRideById(rideId);
            
            // Check if the ride exists
            if (!ride) {
                return res.status(404).send("Ride not found");
            }
            
            // Check if the user is the driver of this ride
            if (ride.driver_id === passengerId) {
                return res.status(400).send("You cannot request your own ride");
            }
            
            // Check if the ride has available seats
            if (ride.seats_available <= 0) {
                return res.status(400).send("No seats available for this ride");
            }
            
            // Check if the user already has a request for this ride
            const hasExistingRequest = await RideModel.checkExistingRequest(rideId, passengerId);
            if (hasExistingRequest) {
                return res.status(400).send("You already have a request for this ride");
            }
            
            // Create the new request with the message
            await RideModel.createRideRequest(rideId, passengerId, message);
            
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
            const currentUserId = req.session.userId;
            
            // Get ride details to verify the current user is the driver
            const ride = await RideModel.getRideById(rideId);
            
            // Check if the ride exists
            if (!ride) {
                return res.status(404).send("Ride not found");
            }
            
            // Verify current user is the driver
            if (ride.driver_id !== currentUserId) {
                return res.status(403).send("Only the driver can accept ride requests");
            }
            
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
            const rideId = parseInt(req.params.rideId, 10);
            const requestId = parseInt(req.params.requestId, 10);
            const currentUserId = req.session.userId;
            
            // Get ride details to verify the current user is the driver
            const ride = await RideModel.getRideById(rideId);
            
            // Check if the ride exists
            if (!ride) {
                return res.status(404).send("Ride not found");
            }
            
            // Verify current user is the driver
            if (ride.driver_id !== currentUserId) {
                return res.status(403).send("Only the driver can reject ride requests");
            }
            
            // Update the request status
            await RideModel.updateRequestStatus(requestId, "rejected");
            
            res.redirect(`/rides/${rideId}`);
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