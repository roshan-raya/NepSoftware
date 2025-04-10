const RideModel = require('../models/rideModel');
const UserModel = require('../models/userModel');
const ReviewModel = require('../models/reviewModel');

class RideController {
    static async getRidesList(req, res) {
        try {
            const search = req.query.search || '';
            const tag = req.query.tag || '';
            const category = req.query.category || '';
            const status = req.query.status || '';
            const preferences = req.query.preferences || '';
            const searchLat = req.query.searchLat || '';
            const searchLng = req.query.searchLng || '';
            const userId = req.session.userId;
            
            console.log("Search parameters:", { 
                search, tag, category, status, preferences, 
                searchLat, searchLng 
            });
            
            // Get all available rides
            try {
                const rides = await RideModel.getAllRides(search, tag, category, status, preferences, searchLat, searchLng);
                
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
                    searchLat,
                    searchLng,
                    categories,
                    availablePreferences,
                    myOfferedRides,
                    myBookedRides,
                    user: userId ? true : false
                });
            } catch (modelError) {
                console.error("Error in RideModel.getAllRides:", modelError);
                return res.status(500).render('error', { 
                    title: 'Database Error',
                    message: 'There was a problem fetching rides from the database.',
                    error: {
                        status: 500,
                        stack: process.env.NODE_ENV === 'development' ? modelError.stack : ''
                    }
                });
            }
        } catch (error) {
            console.error("General error in getRidesList:", error);
            res.status(500).render('error', { 
                title: 'Error',
                message: 'An unexpected error occurred while fetching rides.',
                error: {
                    status: 500,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : ''
                }
            });
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
            
            // Get driver reviews
            const driverReviews = await ReviewModel.getReviewsForUser(ride.driver_id, 'driver');
            
            res.render('rides_detail', { 
                title: `Ride Details: ${ride.pickup_location} to ${ride.dropoff_location}`,
                ride,
                requests,
                driverReviews
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error fetching ride details");
        }
    }

    static async showOfferRideForm(req, res) {
        try {
            console.log("showOfferRideForm - Starting to load the form");
            console.log("Current user ID:", req.session.userId);
            
            // Get any needed data for the form (like available tags)
            const tags = await RideModel.getTags();
            console.log("Tags loaded successfully:", tags ? tags.length : 0);
            
            const categories = await RideModel.getCategories();
            console.log("Categories loaded successfully:", categories ? categories.length : 0);
            
            const preferences = await RideModel.getPreferences();
            console.log("Preferences loaded successfully:", preferences ? preferences.length : 0);
            
            console.log("About to render the offer_ride template");
            res.render('offer_ride', { 
                title: 'Offer a Ride',
                tags,
                categories,
                preferences
            });
            console.log("Render completed successfully");
        } catch (error) {
            console.error("ERROR in showOfferRideForm:", error);
            console.error("Error details:", error.stack);
            res.status(500).render('error', { 
                title: 'Error',
                message: 'Error loading offer ride form',
                error: {
                    status: 500,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : ''
                }
            });
        }
    }

    static async createRide(req, res) {
        try {
            console.log("createRide - Starting to create a new ride");
            const driverId = req.session.userId; // Get the authenticated user's ID
            console.log("Current user ID:", driverId);
            
            const { 
                departureDatetime, 
                pickupLocation, 
                dropoffLocation,
                pickupLat,
                pickupLng,
                dropoffLat,
                dropoffLng, 
                seatsAvailable, 
                tags,
                category = 'Campus Routes',
                preferences = ''
            } = req.body;
            
            console.log("Form data received:", req.body);
            
            // Validate the input
            if (!departureDatetime) {
                console.log("Validation failed: Missing departure date/time");
                return res.status(400).render('offer_ride', {
                    title: 'Offer a Ride',
                    error: 'Please select a departure date and time',
                    formData: req.body
                });
            }
            
            if (!pickupLocation || pickupLocation.trim() === '') {
                console.log("Validation failed: Missing pickup location");
                return res.status(400).render('offer_ride', {
                    title: 'Offer a Ride',
                    error: 'Please enter a valid pickup location',
                    formData: req.body
                });
            }
            
            if (!dropoffLocation || dropoffLocation.trim() === '') {
                console.log("Validation failed: Missing destination");
                return res.status(400).render('offer_ride', {
                    title: 'Offer a Ride',
                    error: 'Please enter a valid destination',
                    formData: req.body
                });
            }
            
            if (!seatsAvailable || isNaN(seatsAvailable) || parseInt(seatsAvailable) < 1 || parseInt(seatsAvailable) > 8) {
                console.log("Validation failed: Invalid seats");
                return res.status(400).render('offer_ride', {
                    title: 'Offer a Ride',
                    error: 'Please enter a valid number of seats (1-8)',
                    formData: req.body
                });
            }
            
            console.log("Validation passed, attempting to create ride");
            
            // Create the new ride
            try {
                const rideId = await RideModel.createRide({
                    driverId,
                    departureDatetime,
                    pickupLocation: pickupLocation.trim(),
                    dropoffLocation: dropoffLocation.trim(),
                    pickupLat: pickupLat ? parseFloat(pickupLat) : null,
                    pickupLng: pickupLng ? parseFloat(pickupLng) : null,
                    dropoffLat: dropoffLat ? parseFloat(dropoffLat) : null,
                    dropoffLng: dropoffLng ? parseFloat(dropoffLng) : null,
                    seatsAvailable: parseInt(seatsAvailable, 10),
                    tags,
                    category,
                    preferences
                });
                
                console.log("Ride created successfully with ID:", rideId);
                
                // Redirect to the new ride's detail page
                res.redirect(`/rides/${rideId}`);
            } catch (dbError) {
                console.error('Database error while creating ride:', dbError);
                
                let errorMessage = 'An error occurred while creating the ride. Please try again.';
                
                // Check for specific error types to provide more helpful messages
                if (dbError.code === 'ER_BAD_FIELD_ERROR') {
                    errorMessage = 'There was a problem with the database schema. Please contact support.';
                } else if (dbError.code === 'ER_NO_REFERENCED_ROW') {
                    errorMessage = 'Invalid user account. Please try logging out and back in.';
                } else if (dbError.code === 'ER_DATA_TOO_LONG') {
                    errorMessage = 'One of the text fields is too long. Please shorten your input.';
                }
                
                // Get required data for the form
                const tags = await RideModel.getTags();
                const categories = await RideModel.getCategories();
                const preferences = await RideModel.getPreferences();
                
                res.status(500).render('offer_ride', {
                    title: 'Offer a Ride',
                    error: errorMessage,
                    formData: req.body,
                    tags,
                    categories,
                    preferences
                });
            }
        } catch (error) {
            console.error('Unexpected error in createRide controller:', error);
            console.error('Error stack:', error.stack);
            
            // Get required data for the form
            try {
                const tags = await RideModel.getTags();
                const categories = await RideModel.getCategories();
                const preferences = await RideModel.getPreferences();
                
                res.status(500).render('offer_ride', {
                    title: 'Offer a Ride',
                    error: 'An unexpected error occurred. Please try again later.',
                    formData: req.body,
                    tags,
                    categories,
                    preferences
                });
            } catch (secondaryError) {
                // If even loading the form data fails, fall back to a simple error
                console.error('Secondary error while handling original error:', secondaryError);
                res.status(500).render('error', {
                    title: 'Error',
                    message: 'A critical error occurred while processing your request.',
                    error: {
                        status: 500,
                        stack: process.env.NODE_ENV === 'development' ? error.stack : ''
                    }
                });
            }
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
            if (ride.seats_available <= 0 || ride.available_seats <= 0) {
                return res.status(400).send("No seats available for this ride");
            }
            
            // Check if the user already has a request for this ride
            const existingRequest = await RideModel.checkExistingRequest(rideId, passengerId);
            if (existingRequest && existingRequest.id) {
                // If there's an existing request, update its message instead of creating a new one
                await RideModel.updateRequestMessage(existingRequest.id, message);
                return res.redirect(`/rides/${rideId}`);
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
            const { rideId, requestId } = req.params;
            const userId = req.session.userId;

            if (!userId) {
                return res.status(401).send("You must be logged in to perform this action");
            }

            // Check if the user is the driver of the ride
            const ride = await RideModel.getRideById(rideId);
            if (!ride || ride.driver_id !== userId) {
                return res.status(403).send("You are not authorized to reject this request");
            }

            // Update the request status to rejected
            await RideModel.updateRequestStatus(requestId, 'rejected');

            // Redirect back to the ride detail page
            res.redirect(`/rides/${rideId}`);
        } catch (error) {
            console.error(error);
            res.status(500).send("Error rejecting ride request");
        }
    }

    static async replyToRequest(req, res) {
        try {
            const { rideId, requestId } = req.params;
            const { reply } = req.body;
            const userId = req.session.userId;

            if (!userId) {
                return res.status(401).send("You must be logged in to perform this action");
            }

            if (!reply || reply.trim() === '') {
                return res.status(400).send("Reply message cannot be empty");
            }

            // Check if the user is the driver of the ride
            const ride = await RideModel.getRideById(rideId);
            if (!ride || ride.driver_id !== userId) {
                return res.status(403).send("You are not authorized to reply to this request");
            }

            // Check if the request exists and is accepted
            const request = await RideModel.getRequestById(requestId);
            if (!request || request.ride_id !== parseInt(rideId) || request.status !== 'accepted') {
                return res.status(404).send("Request not found or not accepted");
            }

            // Add the reply to the request
            await RideModel.addRequestReply(requestId, reply);

            // Redirect back to the ride detail page
            res.redirect(`/rides/${rideId}`);
        } catch (error) {
            console.error(error);
            res.status(500).send("Error replying to request");
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

    static async showEditRideForm(req, res) {
        try {
            const rideId = parseInt(req.params.id, 10);
            const userId = req.session.userId;
            
            // Check if user is authenticated
            if (!userId) {
                return res.redirect('/rides');
            }
            
            // Get ride details
            const ride = await RideModel.getRideById(rideId);
            
            // Check if the ride exists
            if (!ride) {
                return res.status(404).render('error', {
                    title: 'Ride Not Found',
                    message: 'The ride you\'re trying to edit does not exist.'
                });
            }
            
            // Verify current user is the driver
            if (ride.driver_id !== userId) {
                return res.status(403).render('error', {
                    title: 'Access Denied',
                    message: 'Only the driver can edit this ride.'
                });
            }
            
            // Get data for the form
            const tags = await RideModel.getTags();
            const categories = await RideModel.getCategories();
            const preferences = await RideModel.getPreferences();
            
            res.render('edit_ride', {
                title: 'Edit Ride',
                ride,
                tags,
                categories,
                preferences
            });
        } catch (error) {
            console.error('Error in showEditRideForm:', error);
            res.status(500).render('error', {
                title: 'Error',
                message: 'An error occurred while loading the edit form.',
                error: {
                    status: 500,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : ''
                }
            });
        }
    }
    
    static async updateRide(req, res) {
        try {
            const rideId = parseInt(req.params.id, 10);
            const userId = req.session.userId;
            
            // Check if user is authenticated
            if (!userId) {
                return res.redirect('/rides');
            }
            
            // Get ride details
            const ride = await RideModel.getRideById(rideId);
            
            // Check if the ride exists
            if (!ride) {
                return res.status(404).render('error', {
                    title: 'Ride Not Found',
                    message: 'The ride you\'re trying to edit does not exist.'
                });
            }
            
            // Verify current user is the driver
            if (ride.driver_id !== userId) {
                return res.status(403).render('error', {
                    title: 'Access Denied',
                    message: 'Only the driver can edit this ride.'
                });
            }
            
            const {
                departureDatetime,
                pickupLocation,
                dropoffLocation,
                pickupLat,
                pickupLng,
                dropoffLat,
                dropoffLng,
                seatsAvailable,
                tags,
                category,
                preferences
            } = req.body;
            
            // Validate inputs
            if (!departureDatetime || !pickupLocation || !dropoffLocation || !seatsAvailable) {
                // Get needed data for re-rendering the form
                const tagsData = await RideModel.getTags();
                const categoriesData = await RideModel.getCategories();
                const preferencesData = await RideModel.getPreferences();
                
                return res.status(400).render('edit_ride', {
                    title: 'Edit Ride',
                    ride,
                    error: 'Please fill in all required fields.',
                    tags: tagsData,
                    categories: categoriesData,
                    preferences: preferencesData
                });
            }
            
            // Update the ride
            await RideModel.updateRide(rideId, {
                departureDatetime,
                pickupLocation: pickupLocation.trim(),
                dropoffLocation: dropoffLocation.trim(),
                pickupLat: pickupLat ? parseFloat(pickupLat) : null,
                pickupLng: pickupLng ? parseFloat(pickupLng) : null,
                dropoffLat: dropoffLat ? parseFloat(dropoffLat) : null,
                dropoffLng: dropoffLng ? parseFloat(dropoffLng) : null,
                seatsAvailable: parseInt(seatsAvailable),
                tags,
                category,
                preferences
            });
            
            // Redirect to the ride details page
            res.redirect(`/rides/${rideId}`);
        } catch (error) {
            console.error('Error in updateRide:', error);
            res.status(500).render('error', {
                title: 'Error',
                message: 'An error occurred while updating the ride.',
                error: {
                    status: 500,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : ''
                }
            });
        }
    }
}

module.exports = RideController; 