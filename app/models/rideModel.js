const db = require('../services/db');

class RideModel {
    static async getAllRides(search = '', tag = '', category = '', status = '', preferences = '', searchLat = '', searchLng = '') {
        try {
            // Check if the database has coordinate columns
            let hasCoordinateColumns = false;
            try {
                // Try a simple query to check if coordinate columns exist
                const testQuery = `
                    SELECT pickup_lat FROM Rides LIMIT 1
                `;
                await db.query(testQuery);
                hasCoordinateColumns = true;
            } catch (error) {
                console.log('Coordinate columns not detected in database:', error.message);
                hasCoordinateColumns = false;
            }

            // Build the query based on whether coordinate columns exist
            let sql = `
                SELECT r.id, r.driver_id, r.departure_time, r.pickup_location, r.destination,
                       ${hasCoordinateColumns ? 'r.pickup_lat, r.pickup_lng, r.destination_lat, r.destination_lng,' : ''}
                       r.seats_available, r.tags, r.category, r.status, r.preferences, r.created_at,
                       u.name AS driver_name, u.profile_photo
                FROM Rides r
                JOIN Users u ON r.driver_id = u.id
            `;

            let conditions = [];
            const params = [];
            
            // Add search term conditions
            if (search) {
                conditions.push(`(r.pickup_location LIKE ? OR r.destination LIKE ? OR r.tags LIKE ?)`);
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            
            // Skip geographic search if coordinates are not in the database
            if (searchLat && searchLng && hasCoordinateColumns) {
                try {
                    const lat = parseFloat(searchLat);
                    const lng = parseFloat(searchLng);
                    
                    // Only proceed if we have valid numbers
                    if (!isNaN(lat) && !isNaN(lng)) {
                        // Use a simpler bounding box approach for better performance and reliability
                        // Calculate a rough bounding box (approx 15km radius)
                        const latRadius = 0.135; // roughly 15km in latitude degrees
                        const lngRadius = 0.18;  // roughly 15km in longitude degrees at UK latitude
                        
                        conditions.push(`(
                            (r.pickup_lat IS NOT NULL AND r.pickup_lng IS NOT NULL AND 
                             r.pickup_lat BETWEEN ? AND ? AND
                             r.pickup_lng BETWEEN ? AND ?)
                            OR
                            (r.destination_lat IS NOT NULL AND r.destination_lng IS NOT NULL AND 
                             r.destination_lat BETWEEN ? AND ? AND
                             r.destination_lng BETWEEN ? AND ?)
                        )`);
                        
                        // Add bounding box parameters
                        params.push(
                            lat - latRadius, lat + latRadius, 
                            lng - lngRadius, lng + lngRadius,
                            lat - latRadius, lat + latRadius, 
                            lng - lngRadius, lng + lngRadius
                        );
                    } else {
                        console.log('Invalid geographic coordinates:', { searchLat, searchLng });
                    }
                } catch (error) {
                    console.error('Error processing geographic search:', error);
                    // Continue with search without geographic filtering if there's an error
                }
            }
            
            // Add other filter conditions
            if (tag) {
                conditions.push(`r.tags LIKE ?`);
                params.push(`%${tag}%`);
            }
            
            if (category) {
                conditions.push(`r.category = ?`);
                params.push(category);
            }
            
            if (status) {
                conditions.push(`r.status = ?`);
                params.push(status);
            }
            
            if (preferences) {
                conditions.push(`r.preferences LIKE ?`);
                params.push(`%${preferences}%`);
            }
            
            // Add WHERE clause if there are any conditions
            if (conditions.length > 0) {
                sql += ` WHERE ${conditions.join(' AND ')}`;
            }
            
            // Add sorting
            sql += ` ORDER BY r.departure_time`;
            
            console.log('Final SQL:', sql);
            console.log('SQL Parameters:', params);
            
            // Execute query with error handling
            try {
                const result = await db.query(sql, params);
                console.log(`Retrieved ${result.length} rides`);
                return result;
            } catch (dbError) {
                console.error('Database query failed:', dbError);
                
                // If we were trying to do geographic search, retry without it
                if (searchLat && searchLng) {
                    console.log('Attempting fallback query without geographic search...');
                    // Retry without geographic search
                    return await RideModel.getAllRides(search, tag, category, status, preferences, '', '');
                }
                throw dbError;
            }
        } catch (error) {
            console.error('Error in getAllRides:', error);
            throw error;
        }
    }

    static async getRideById(id) {
        const sql = `
            SELECT r.*, u.name AS driver_name, u.profile_photo
            FROM Rides r
            JOIN Users u ON r.driver_id = u.id
            WHERE r.id = ?
        `;
        const [ride] = await db.query(sql, [id]);
        return ride;
    }

    static async getRideRequests(rideId) {
        const sql = `
            SELECT rr.*, u.name AS passenger_name, u.profile_photo
            FROM Ride_Requests rr
            JOIN Users u ON rr.passenger_id = u.id
            WHERE rr.ride_id = ?
            ORDER BY rr.requested_at
        `;
        return await db.query(sql, [rideId]);
    }

    static async checkRideAvailability(rideId) {
        const sql = 'SELECT * FROM Rides WHERE id = ? AND seats_available > 0 AND available_seats > 0';
        const [ride] = await db.query(sql, [rideId]);
        return ride;
    }

    static async checkExistingRequest(rideId, passengerId) {
        const sql = 'SELECT * FROM Ride_Requests WHERE ride_id = ? AND passenger_id = ?';
        const [request] = await db.query(sql, [rideId, passengerId]);
        return request;
    }

    static async updateRequestMessage(requestId, message) {
        const sql = `
            UPDATE Ride_Requests
            SET message = ?, updated_at = NOW()
            WHERE id = ?
        `;
        await db.query(sql, [message, requestId]);
    }

    static async addRequestReply(requestId, reply) {
        const sql = `
            UPDATE Ride_Requests
            SET driver_reply = ?, reply_updated_at = NOW()
            WHERE id = ?
        `;
        await db.query(sql, [reply, requestId]);
    }

    static async getRequestById(requestId) {
        const sql = `
            SELECT * FROM Ride_Requests
            WHERE id = ?
        `;
        const [request] = await db.query(sql, [requestId]);
        return request;
    }

    static async createRideRequest(rideId, passengerId, message = '') {
        const sql = 'INSERT INTO Ride_Requests (ride_id, passenger_id, status, message) VALUES (?, ?, "pending", ?)';
        return await db.query(sql, [rideId, passengerId, message]);
    }

    static async updateRequestStatus(requestId, status) {
        const sql = 'UPDATE Ride_Requests SET status = ? WHERE id = ?';
        return await db.query(sql, [status, requestId]);
    }

    static async updateRideSeats(rideId) {
        const sql = 'UPDATE Rides SET seats_available = seats_available - 1, available_seats = available_seats - 1 WHERE id = ? AND seats_available > 0';
        return await db.query(sql, [rideId]);
    }

    static async getTags() {
        try {
            const sql = `
                SELECT DISTINCT TRIM(tags) AS name, 
                       COUNT(*) AS ride_count
                FROM Rides
                WHERE tags IS NOT NULL AND tags != ''
                GROUP BY TRIM(tags)
                ORDER BY name;
            `;
            return await db.query(sql);
        } catch (error) {
            console.error('Error in getTags:', error);
            // Return empty array instead of throwing to avoid breaking the form
            return [];
        }
    }

    static async getRidesByTag(tag) {
        const sql = `
            SELECT r.*, u.name AS driver_name, u.profile_photo
            FROM Rides r
            JOIN Users u ON r.driver_id = u.id
            WHERE r.tags = ? OR r.tags LIKE ? OR r.tags LIKE ? OR r.tags LIKE ?
            ORDER BY r.departure_time;
        `;
        return await db.query(sql, [tag, `${tag},%`, `%,${tag},%`, `%,${tag}`]);
    }

    static async getRidesByDriver(driverId) {
        const sql = `
            SELECT r.*, u.name AS driver_name, u.profile_photo
            FROM Rides r
            JOIN Users u ON r.driver_id = u.id
            WHERE r.driver_id = ?
            ORDER BY r.departure_time DESC
        `;
        return await db.query(sql, [driverId]);
    }

    static async getRidesByPassenger(passengerId) {
        const sql = `
            SELECT r.*, u.name AS driver_name, u.profile_photo
            FROM Rides r
            JOIN Users u ON r.driver_id = u.id
            JOIN Ride_Requests rr ON r.id = rr.ride_id
            WHERE rr.passenger_id = ? AND rr.status = 'accepted'
            ORDER BY r.departure_time DESC
        `;
        return await db.query(sql, [passengerId]);
    }

    static async deleteRide(rideId) {
        // First delete all ride requests for this ride
        const deleteRequestsSql = 'DELETE FROM Ride_Requests WHERE ride_id = ?';
        await db.query(deleteRequestsSql, [rideId]);
        
        // Then delete the ride
        const deleteRideSql = 'DELETE FROM Rides WHERE id = ?';
        return await db.query(deleteRideSql, [rideId]);
    }

    static async createRide({ 
        driverId, 
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
    }) {
        try {
            console.log('createRide called with parameters:', {
                driverId, 
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
            });
            
            // Check if the database has coordinate columns
            let hasCoordinateColumns = false;
            try {
                // Try a simple query to check if coordinate columns exist
                const testQuery = `
                    SELECT pickup_lat FROM Rides LIMIT 1
                `;
                await db.query(testQuery);
                hasCoordinateColumns = true;
                console.log('Coordinate columns detected in database');
            } catch (error) {
                console.log('Coordinate columns not detected in database:', error.message);
                hasCoordinateColumns = false;
            }

            let sql;
            let params;

            if (hasCoordinateColumns) {
                // Use the full SQL with coordinates
                sql = `
                    INSERT INTO Rides (
                        driver_id, 
                        departure_time, 
                        pickup_location, 
                        pickup_lat, 
                        pickup_lng, 
                        destination, 
                        destination_lat, 
                        destination_lng, 
                        seats_available, 
                        available_seats,
                        tags, 
                        category, 
                        preferences, 
                        status, 
                        created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available', NOW())
                `;
                params = [
                    driverId, 
                    departureDatetime, 
                    pickupLocation, 
                    pickupLat || null, 
                    pickupLng || null, 
                    dropoffLocation, 
                    dropoffLat || null, 
                    dropoffLng || null, 
                    seatsAvailable,
                    seatsAvailable, // Set available_seats equal to seats_available
                    tags, 
                    category, 
                    preferences
                ];
            } else {
                // Use simplified SQL without coordinates
                sql = `
                    INSERT INTO Rides (
                        driver_id, 
                        departure_time, 
                        pickup_location, 
                        destination, 
                        seats_available, 
                        available_seats,
                        tags, 
                        category, 
                        preferences, 
                        status, 
                        created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available', NOW())
                `;
                params = [
                    driverId, 
                    departureDatetime, 
                    pickupLocation, 
                    dropoffLocation, 
                    seatsAvailable,
                    seatsAvailable, // Set available_seats equal to seats_available
                    tags, 
                    category, 
                    preferences
                ];
            }

            console.log('Executing SQL:', sql);
            console.log('With parameters:', params);

            const result = await db.query(sql, params);
            console.log('Ride created successfully with ID:', result.insertId);
            return result.insertId;
        } catch (error) {
            console.error('Error creating ride:', error);
            console.error('Error details:', error.stack);
            console.error('Error SQL state:', error.sqlState);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            throw error;
        }
    }

    static async getCategories() {
        try {
            const sql = `
                SELECT DISTINCT category, COUNT(*) AS ride_count
                FROM Rides
                GROUP BY category
                ORDER BY category;
            `;
            return await db.query(sql);
        } catch (error) {
            console.error('Error in getCategories:', error);
            // Return empty array instead of throwing to avoid breaking the form
            return [];
        }
    }
    
    static async getRidesByCategory(category) {
        const sql = `
            SELECT r.*, u.name AS driver_name, u.profile_photo
            FROM Rides r
            JOIN Users u ON r.driver_id = u.id
            WHERE r.category = ?
            ORDER BY r.departure_time;
        `;
        return await db.query(sql, [category]);
    }
    
    static async getPreferences() {
        try {
            const sql = `
                SELECT DISTINCT TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(preferences, ',', n.n), ',', -1)) AS preference,
                       COUNT(*) AS ride_count
                FROM Rides
                JOIN (
                    SELECT 1 AS n UNION ALL
                    SELECT 2 UNION ALL
                    SELECT 3 UNION ALL
                    SELECT 4 UNION ALL
                    SELECT 5
                ) n ON CHAR_LENGTH(preferences) - CHAR_LENGTH(REPLACE(preferences, ',', '')) >= n.n - 1
                WHERE preferences IS NOT NULL AND preferences != ''
                GROUP BY preference
                ORDER BY preference;
            `;
            return await db.query(sql);
        } catch (error) {
            console.error('Error in getPreferences:', error);
            // Return empty array instead of throwing to avoid breaking the form
            return [];
        }
    }
    
    static async getRidesByPreference(preference) {
        const sql = `
            SELECT r.*, u.name AS driver_name, u.profile_photo
            FROM Rides r
            JOIN Users u ON r.driver_id = u.id
            WHERE 
                r.preferences = ? OR 
                r.preferences LIKE ? OR 
                r.preferences LIKE ? OR 
                r.preferences LIKE ?
            ORDER BY r.departure_time;
        `;
        return await db.query(sql, [preference, `${preference},%`, `%,${preference},%`, `%,${preference}`]);
    }

    static async updateRideStatus(rideId, status) {
        const sql = 'UPDATE Rides SET status = ? WHERE id = ?';
        return await db.query(sql, [status, rideId]);
    }
    
    static async updateRide(rideId, {
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
    }) {
        try {
            console.log('updateRide called with parameters:', {
                rideId,
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
            });
            
            // Get current ride to check for seats_available vs available_seats
            const currentRide = await this.getRideById(rideId);
            
            // Calculate the seat difference
            const seatsDifference = seatsAvailable - currentRide.seats_available;
            
            // Check if the database has coordinate columns
            let hasCoordinateColumns = false;
            try {
                // Try a simple query to check if coordinate columns exist
                const testQuery = `
                    SELECT pickup_lat FROM Rides LIMIT 1
                `;
                await db.query(testQuery);
                hasCoordinateColumns = true;
                console.log('Coordinate columns detected in database');
            } catch (error) {
                console.log('Coordinate columns not detected in database:', error.message);
                hasCoordinateColumns = false;
            }

            let sql;
            let params;

            if (hasCoordinateColumns) {
                // Use the full SQL with coordinates
                sql = `
                    UPDATE Rides
                    SET departure_time = ?,
                        pickup_location = ?,
                        pickup_lat = ?,
                        pickup_lng = ?,
                        destination = ?,
                        destination_lat = ?,
                        destination_lng = ?,
                        seats_available = ?,
                        available_seats = available_seats + ?,
                        tags = ?,
                        category = ?,
                        preferences = ?
                    WHERE id = ?
                `;
                params = [
                    departureDatetime,
                    pickupLocation,
                    pickupLat || null,
                    pickupLng || null,
                    dropoffLocation,
                    dropoffLat || null,
                    dropoffLng || null,
                    seatsAvailable,
                    seatsDifference, // Update available_seats based on the difference
                    tags,
                    category,
                    preferences,
                    rideId
                ];
            } else {
                // Use simplified SQL without coordinates
                sql = `
                    UPDATE Rides
                    SET departure_time = ?,
                        pickup_location = ?,
                        destination = ?,
                        seats_available = ?,
                        available_seats = available_seats + ?,
                        tags = ?,
                        category = ?,
                        preferences = ?
                    WHERE id = ?
                `;
                params = [
                    departureDatetime,
                    pickupLocation,
                    dropoffLocation,
                    seatsAvailable,
                    seatsDifference, // Update available_seats based on the difference
                    tags,
                    category,
                    preferences,
                    rideId
                ];
            }

            console.log('Executing SQL:', sql);
            console.log('With parameters:', params);

            return await db.query(sql, params);
        } catch (error) {
            console.error('Error updating ride:', error);
            console.error('Error details:', error.stack);
            throw error;
        }
    }
}

module.exports = RideModel; 