const RideModel = require('../models/rideModel');
const UserModel = require('../models/userModel');
const MatchingService = require('../services/matchingService');
const db = require('../services/db');

class RideController {
    static async getRidesList(req, res) {
        try {
            const search = req.query.search || '';
            const tag = req.query.tag || '';
            
            // Use matching service if user is authenticated
            let rides;
            if (req.user) {
                rides = await MatchingService.findMatchingRides(req.query, req.user.id);
            } else {
                rides = await RideModel.getAllRides(search, tag);
            }
            
            res.render('rides_list', { 
                title: 'Available Rides', 
                rides,
                search,
                tag,
                user: req.user,
                googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
            });
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error fetching rides',
                error: { status: 500 }
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
            
            // Get driver details including ratings
            const driver = await UserModel.getUserById(ride.driver_id);
            
            // Get driver's average rating
            const ratingsSql = 'SELECT AVG(rating) as avg_rating FROM Ratings WHERE rated_id = ?';
            const [ratingResult] = await db.query(ratingsSql, [ride.driver_id]);
            const driverRating = ratingResult.avg_rating || 0;
            
            // Check if the current user has already requested this ride
            let userRequest = null;
            if (req.user) {
                const requestSql = 'SELECT * FROM Ride_Requests WHERE ride_id = ? AND passenger_id = ?';
                const existingRequests = await db.query(requestSql, [rideId, req.user.id]);
                if (existingRequests.length > 0) {
                    userRequest = existingRequests[0];
                }
            }
            
            res.render('rides_detail', { 
                title: `Ride Details: ${ride.pickup_location}`,
                ride,
                requests,
                driver,
                driverRating,
                userRequest,
                user: req.user,
                googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
            });
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error fetching ride details',
                error: { status: 500 }
            });
        }
    }

    static async submitRideRequest(req, res) {
        try {
            const rideId = parseInt(req.params.id, 10);
            const passengerId = req.user.id;
            
            // Check if the ride exists and has available seats
            const ride = await RideModel.checkRideAvailability(rideId);
            if (!ride) {
                return res.status(404).render('error', {
                    message: 'Ride not found or no seats available',
                    error: { status: 404 }
                });
            }
            
            // Check if user is trying to request their own ride
            if (ride.driver_id === passengerId) {
                return res.status(400).render('error', {
                    message: 'You cannot request your own ride',
                    error: { status: 400 }
                });
            }
            
            // Check if the user already has a request for this ride
            const hasExistingRequest = await RideModel.checkExistingRequest(rideId, passengerId);
            if (hasExistingRequest) {
                return res.status(400).render('error', {
                    message: 'You already have a request for this ride',
                    error: { status: 400 }
                });
            }
            
            // Create the new request
            await RideModel.createRideRequest(rideId, passengerId);
            
            // Redirect to ride details page
            res.redirect(`/rides/${rideId}`);
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error submitting ride request',
                error: { status: 500 }
            });
        }
    }

    static async acceptRideRequest(req, res) {
        try {
            const rideId = parseInt(req.params.rideId, 10);
            const requestId = parseInt(req.params.requestId, 10);
            
            // Check if user is the ride owner
            const ride = await RideModel.getRideById(rideId);
            if (ride.driver_id !== req.user.id) {
                return res.status(403).render('error', {
                    message: 'Unauthorized: Only the ride owner can accept requests',
                    error: { status: 403 }
                });
            }
            
            // Update the request status
            await RideModel.updateRequestStatus(requestId, "accepted");
            
            // Get passenger info for notification
            const requestSql = 'SELECT passenger_id FROM Ride_Requests WHERE id = ?';
            const [request] = await db.query(requestSql, [requestId]);
            
            if (request) {
                // Create notification message
                const message = `Your ride request for ${ride.pickup_location} to ${ride.destination} has been accepted!`;
                
                // Create a message in the messaging system
                const messageSql = `
                    INSERT INTO Messages (sender_id, receiver_id, ride_id, message_text)
                    VALUES (?, ?, ?, ?)
                `;
                
                await db.query(
                    messageSql,
                    [req.user.id, request.passenger_id, rideId, message]
                );
            }
            
            res.redirect(`/rides/${rideId}`);
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error accepting ride request',
                error: { status: 500 }
            });
        }
    }

    static async rejectRideRequest(req, res) {
        try {
            const rideId = parseInt(req.params.rideId, 10);
            const requestId = parseInt(req.params.requestId, 10);
            
            // Check if user is the ride owner
            const ride = await RideModel.getRideById(rideId);
            if (ride.driver_id !== req.user.id) {
                return res.status(403).render('error', {
                    message: 'Unauthorized: Only the ride owner can reject requests',
                    error: { status: 403 }
                });
            }
            
            // Update the request status
            await RideModel.updateRequestStatus(requestId, "rejected");
            
            res.redirect(`/rides/${rideId}`);
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error rejecting ride request',
                error: { status: 500 }
            });
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
                taggedRides,
                user: req.user
            });
        } catch (error) {
            console.error('Error in /tags route:', error);
            res.status(500).render('error', { 
                message: 'Error fetching tags', 
                error: { status: 500 } 
            });
        }
    }
    
    static async getCreateRideForm(req, res) {
        try {
            // Check if user is allowed to create rides
            const user = await UserModel.getUserById(req.user.id);
            
            if (!user.is_driver) {
                return res.render('rides/become_driver', {
                    title: 'Become a Driver',
                    user: req.user
                });
            }
            
            res.render('rides/create_ride', {
                title: 'Offer a Ride',
                user: req.user,
                googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
            });
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error loading create ride form',
                error: { status: 500 }
            });
        }
    }
    
    static async postCreateRide(req, res) {
        try {
            const { pickup_location, destination, departure_date, departure_time, 
                   seats_available, price_per_seat, smoking_allowed, tags } = req.body;
            
            // Combine date and time
            const departure_datetime = new Date(`${departure_date}T${departure_time}`);
            
            // Create ride
            const insertSql = `
                INSERT INTO Rides (
                    driver_id, 
                    departure_time, 
                    pickup_location, 
                    destination, 
                    seats_available, 
                    price_per_seat, 
                    smoking_allowed, 
                    tags
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const result = await db.query(
                insertSql, 
                [
                    req.user.id, 
                    departure_datetime, 
                    pickup_location, 
                    destination || 'University of Roehampton', 
                    seats_available, 
                    price_per_seat || 0, 
                    smoking_allowed === 'on' ? true : false, 
                    tags
                ]
            );
            
            if (result.insertId) {
                res.redirect(`/rides/${result.insertId}`);
            } else {
                throw new Error('Failed to create ride');
            }
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error creating ride',
                error: { status: 500 }
            });
        }
    }
    
    static async getSearchRidesForm(req, res) {
        try {
            // Get user preferences for default values if user is logged in
            let userPrefs = null;
            if (req.user) {
                userPrefs = await MatchingService.getUserPreferences(req.user.id);
            }
            
            res.render('rides/search_rides', {
                title: 'Find a Ride',
                user: req.user,
                userPrefs,
                googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
            });
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error loading search form',
                error: { status: 500 }
            });
        }
    }
    
    static async cancelRide(req, res) {
        try {
            const rideId = parseInt(req.params.id, 10);
            
            // Check if user is the ride owner
            const ride = await RideModel.getRideById(rideId);
            if (!ride || ride.driver_id !== req.user.id) {
                return res.status(403).render('error', {
                    message: 'Unauthorized: Only the ride owner can cancel this ride',
                    error: { status: 403 }
                });
            }
            
            // Delete the ride (this will cascade delete requests due to FK constraints)
            const deleteSql = 'DELETE FROM Rides WHERE id = ?';
            await db.query(deleteSql, [rideId]);
            
            res.redirect('/dashboard');
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error canceling ride',
                error: { status: 500 }
            });
        }
    }
    
    static async cancelRequest(req, res) {
        try {
            const requestId = parseInt(req.params.id, 10);
            
            // Check if user is the request owner
            const requestSql = 'SELECT * FROM Ride_Requests WHERE id = ?';
            const [request] = await db.query(requestSql, [requestId]);
            
            if (!request || request.passenger_id !== req.user.id) {
                return res.status(403).render('error', {
                    message: 'Unauthorized: Only the request owner can cancel this request',
                    error: { status: 403 }
                });
            }
            
            // Delete the request
            const deleteSql = 'DELETE FROM Ride_Requests WHERE id = ?';
            await db.query(deleteSql, [requestId]);
            
            res.redirect(`/rides/${request.ride_id}`);
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {
                message: 'Error canceling request',
                error: { status: 500 }
            });
        }
    }
}

module.exports = RideController; 