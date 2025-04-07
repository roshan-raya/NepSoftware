const RideModel = require('../models/rideModel');
const UserModel = require('../models/userModel');

class RideController {
    static async getRidesList(req, res) {
        try {
            const search = req.query.search || '';
            const tag = req.query.tag || '';
            const category = req.query.category || '';
            const status = req.query.status || '';
            const preferences = req.query.preferences || '';
            const userId = req.session.userId;
            
            // Get all available rides
            const rides = await RideModel.getAllRides(search, tag, category, status, preferences);
            
            // Get user's offered and booked rides if user is logged in
            let myOfferedRides = [];
            let myBookedRides = [];
            
            if (userId) {
                myOfferedRides = await RideModel.getRidesByDriver(userId);
                myBookedRides = await RideModel.getRidesByPassenger(userId);
            }
            
            // Get ride categories and preferences for filtering
            const categories = await RideModel.getCategories();
            const availablePreferences = await RideModel.getPreferences();
            
            res.render('rides_list', { 
                title: 'Available Rides', 
                rides,
                search,
                tag,
                category,
                status,
                preferences,
                categories,
                availablePreferences,
                myOfferedRides,
                myBookedRides,
                user: userId ? true : false
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
            const categories = await RideModel.getCategories();
            const preferences = await RideModel.getPreferences();
            
            res.render('offer_ride', { 
                title: 'Offer a Ride',
                tags,
                categories,
                preferences
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error loading offer ride form");
        }
    }

    static async createRide(req, res) {
        try {
            const driverId = req.session.userId; // Get the authenticated user's ID
            const { 
                departureDatetime, 
                pickupLocation, 
                dropoffLocation, 
                seatsAvailable, 
                tags,
                category = 'Campus Routes',
                preferences = ''
            } = req.body;
            
            // Validate the input
            if (!departureDatetime || !pickupLocation || !dropoffLocation || !seatsAvailable) {
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
                dropoffLocation,
                seatsAvailable: parseInt(seatsAvailable, 10),
                tags,
                category,
                preferences
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
            // Check if user is authenticated
            if (!req.session.userId) {
                return res.status(401).send("You must be logged in to request a ride");
            }
            
            const rideId = parseInt(req.params.id, 10);
            const passengerId = req.session.userId; // Get the authenticated user's ID
            const message = req.body.message || ''; // Get the message from the form
            
            // Verify the user exists
            const user = await UserModel.findById(passengerId);
            if (!user) {
                return res.status(400).send("Invalid user ID. Please log out and log in again.");
            }
            
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

    static async getCategoriesList(req, res) {
        try {
            const categories = await RideModel.getCategories();
            const selectedCategory = req.query.category;
            let categorizedRides = [];
            
            if (selectedCategory) {
                categorizedRides = await RideModel.getRidesByCategory(selectedCategory);
            }
            
            res.render('categories_list', { 
                title: 'Ride Categories', 
                categories, 
                selectedCategory, 
                categorizedRides 
            });
        } catch (error) {
            console.error('Error in /categories route:', error);
            res.status(500).render('error', { 
                message: 'Error fetching categories', 
                error 
            });
        }
    }

    static async getPreferencesList(req, res) {
        try {
            const preferences = await RideModel.getPreferences();
            const selectedPreference = req.query.preference;
            let preferencedRides = [];
            
            if (selectedPreference) {
                preferencedRides = await RideModel.getRidesByPreference(selectedPreference);
            }
            
            res.render('preferences_list', { 
                title: 'Ride Preferences', 
                preferences, 
                selectedPreference, 
                preferencedRides 
            });
        } catch (error) {
            console.error('Error in /preferences route:', error);
            res.status(500).render('error', { 
                message: 'Error fetching preferences', 
                error 
            });
        }
    }

    static async updateRideStatus(req, res) {
        try {
            const rideId = parseInt(req.params.id, 10);
            const { status } = req.body;
            const userId = req.session.userId;
            
            // Get ride details to verify the current user is the driver
            const ride = await RideModel.getRideById(rideId);
            
            // Check if the ride exists
            if (!ride) {
                return res.status(404).send("Ride not found");
            }
            
            // Verify current user is the driver
            if (ride.driver_id !== userId) {
                return res.status(403).send("Only the driver can update ride status");
            }
            
            // Update the ride status
            await RideModel.updateRideStatus(rideId, status);
            
            res.redirect(`/rides/${rideId}`);
        } catch (error) {
            console.error(error);
            res.status(500).send("Error updating ride status");
        }
    }

    static async deleteRide(req, res) {
        try {
            const rideId = parseInt(req.params.id, 10);
            const userId = req.session.userId;
            
            // Get ride details to verify the current user is the driver
            const ride = await RideModel.getRideById(rideId);
            
            // Check if the ride exists
            if (!ride) {
                return res.status(404).send("Ride not found");
            }
            
            // Verify current user is the driver
            if (ride.driver_id !== userId) {
                return res.status(403).send("Only the driver can delete this ride");
            }
            
            // Delete the ride
            await RideModel.deleteRide(rideId);
            
            res.status(200).send("Ride deleted successfully");
        } catch (error) {
            console.error(error);
            res.status(500).send("Error deleting ride");
        }
    }
}

module.exports = RideController; 