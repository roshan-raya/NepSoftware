const db = require('../services/db');

class RideModel {
    static async getAllRides(search = '', tag = '', category = '', status = '', preferences = '') {
        let sql = `
            SELECT r.id, r.driver_id, r.departure_time, r.pickup_location, 
                   r.seats_available, r.tags, r.category, r.status, r.preferences, r.created_at,
                   u.name AS driver_name, u.profile_photo
            FROM Rides r
            JOIN Users u ON r.driver_id = u.id
            ORDER BY r.departure_time
        `;
        
        if (search || tag || category || status || preferences) {
            let conditions = [];
            if (search) {
                conditions.push(`(r.pickup_location LIKE ? OR r.tags LIKE ?)`);
            }
            if (tag) {
                conditions.push(`r.tags LIKE ?`);
            }
            if (category) {
                conditions.push(`r.category = ?`);
            }
            if (status) {
                conditions.push(`r.status = ?`);
            }
            if (preferences) {
                conditions.push(`r.preferences LIKE ?`);
            }
            sql = sql.replace('ORDER BY', `WHERE ${conditions.join(' AND ')} ORDER BY`);
        }
        
        const params = [];
        if (search) {
            params.push(`%${search}%`, `%${search}%`);
        }
        if (tag) {
            params.push(`%${tag}%`);
        }
        if (category) {
            params.push(category);
        }
        if (status) {
            params.push(status);
        }
        if (preferences) {
            params.push(`%${preferences}%`);
        }
        
        return await db.query(sql, params);
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
        const sql = 'SELECT * FROM Rides WHERE id = ? AND seats_available > 0';
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
        const sql = 'UPDATE Rides SET seats_available = seats_available - 1 WHERE id = ? AND seats_available > 0';
        return await db.query(sql, [rideId]);
    }

    static async getTags() {
        const sql = `
            SELECT DISTINCT TRIM(tags) AS name, 
                   COUNT(*) AS ride_count
            FROM Rides
            WHERE tags IS NOT NULL AND tags != ''
            GROUP BY TRIM(tags)
            ORDER BY name;
        `;
        return await db.query(sql);
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

    static async createRide({ driverId, departureDatetime, pickupLocation, dropoffLocation, seatsAvailable, tags, category, preferences }) {
        const sql = `
            INSERT INTO Rides (driver_id, departure_time, pickup_location, dropoff_location, seats_available, tags, category, preferences, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Available', NOW())
        `;
        const result = await db.query(sql, [driverId, departureDatetime, pickupLocation, dropoffLocation, seatsAvailable, tags, category, preferences]);
        return result.insertId;
    }

    static async getCategories() {
        const sql = `
            SELECT DISTINCT category, COUNT(*) AS ride_count
            FROM Rides
            GROUP BY category
            ORDER BY category;
        `;
        return await db.query(sql);
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
}

module.exports = RideModel; 